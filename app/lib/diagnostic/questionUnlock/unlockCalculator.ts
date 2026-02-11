/**
 * Question Unlock Algorithm - Unlock Calculator
 *
 * Calculates the marginal value of mastering each non-mastered atom.
 * Considers:
 * - Immediate question unlocks (atom is the only missing piece)
 * - Progress contributions (atom is one of several missing)
 * - Prerequisite dependencies (cost to unlock this atom)
 */

import type {
  AtomWithPrereqs,
  QuestionWithAtoms,
  AtomMasteryState,
  AtomMarginalValue,
  QuestionUnlockStatus,
  ScoringConfig,
} from "./types";
import { DEFAULT_SCORING_CONFIG } from "./types";
import { getNonMasteredAtomIds, getMasteredAtomIds } from "./masteryAnalyzer";

// ============================================================================
// PREREQUISITE ANALYSIS
// ============================================================================

/**
 * Calculates the prerequisite chain cost for an atom.
 * Returns all prerequisites (recursive) that are not yet mastered.
 */
export function getUnmasteredPrerequisites(
  atomId: string,
  allAtoms: Map<string, AtomWithPrereqs>,
  masteredAtoms: Set<string>,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(atomId)) return [];
  visited.add(atomId);

  const atom = allAtoms.get(atomId);
  if (!atom) return [];

  const unmasteredPrereqs: string[] = [];

  for (const prereqId of atom.prerequisiteIds) {
    if (!masteredAtoms.has(prereqId)) {
      unmasteredPrereqs.push(prereqId);

      // Recursively get prerequisites of prerequisites
      const nested = getUnmasteredPrerequisites(
        prereqId,
        allAtoms,
        masteredAtoms,
        visited
      );
      unmasteredPrereqs.push(...nested);
    }
  }

  // Return unique prerequisites
  return [...new Set(unmasteredPrereqs)];
}

// ============================================================================
// MARGINAL VALUE CALCULATION
// ============================================================================

/**
 * Calculates the marginal value of mastering a single atom.
 * This is the core algorithm that determines atom priority.
 */
export function calculateAtomMarginalValue(
  atomId: string,
  allAtoms: Map<string, AtomWithPrereqs>,
  questions: Map<string, QuestionWithAtoms>,
  masteredAtoms: Set<string>,
  questionStatuses: QuestionUnlockStatus[],
  config: ScoringConfig
): AtomMarginalValue {
  const atom = allAtoms.get(atomId);
  if (!atom) {
    throw new Error(`Atom ${atomId} not found`);
  }

  const immediateUnlocks: string[] = [];
  const progressContributions = new Map<string, number>();

  // Analyze each locked question
  for (const status of questionStatuses) {
    if (status.isUnlocked) continue;

    const isPrimary = status.missingPrimaryAtoms.includes(atomId);
    if (!isPrimary) continue;

    // Check if this atom is the ONLY missing primary atom
    if (status.missingPrimaryAtoms.length === 1) {
      immediateUnlocks.push(status.questionId);
    } else {
      // This atom contributes to progress
      const remainingAfter = status.missingPrimaryAtoms.length - 1;
      progressContributions.set(status.questionId, remainingAfter);
    }
  }

  // Calculate unlock score
  let score = 0;

  // Immediate unlocks are most valuable
  score += immediateUnlocks.length * config.immediateUnlockWeight;

  // Progress contributions weighted by how close we get
  for (const [, remaining] of progressContributions) {
    if (remaining === 1) {
      // After mastering this atom, question will be 1 away
      score += config.twoAwayWeight;
    } else {
      score += config.threeOrMoreWeight;
    }
  }

  // Calculate prerequisite cost
  const prereqsNeeded = getUnmasteredPrerequisites(
    atomId,
    allAtoms,
    masteredAtoms
  );
  const totalCost = 1 + prereqsNeeded.length;

  // Efficiency = score per atom you need to learn
  const efficiency = totalCost > 0 ? score / totalCost : 0;

  return {
    atomId,
    axis: atom.axis,
    title: atom.title,
    immediateUnlocks,
    progressContributions,
    unlockScore: score,
    prerequisitesNeeded: prereqsNeeded,
    totalCost,
    efficiency,
  };
}

/**
 * Calculates marginal values for all non-mastered atoms.
 * Sorts by efficiency (best value per effort).
 */
export function calculateAllMarginalValues(
  allAtoms: Map<string, AtomWithPrereqs>,
  questions: Map<string, QuestionWithAtoms>,
  masteryMap: Map<string, AtomMasteryState>,
  questionStatuses: QuestionUnlockStatus[],
  config: ScoringConfig = { ...DEFAULT_SCORING_CONFIG }
): AtomMarginalValue[] {
  const masteredAtoms = getMasteredAtomIds(masteryMap);
  const nonMasteredAtoms = getNonMasteredAtomIds(masteryMap);

  const marginalValues: AtomMarginalValue[] = [];

  for (const atomId of nonMasteredAtoms) {
    const value = calculateAtomMarginalValue(
      atomId,
      allAtoms,
      questions,
      masteredAtoms,
      questionStatuses,
      config
    );
    marginalValues.push(value);
  }

  // Sort by efficiency (descending)
  marginalValues.sort((a, b) => b.efficiency - a.efficiency);

  return marginalValues;
}

// ============================================================================
// SIMULATION: "WHAT IF" ANALYSIS
// ============================================================================

/**
 * Simulates mastering an atom and returns the new state.
 * Used internally by simulateQuestionUnlocks.
 */
function simulateMastery(
  atomIds: string[],
  currentMastered: Set<string>
): Set<string> {
  const newMastered = new Set(currentMastered);

  for (const atomId of atomIds) {
    newMastered.add(atomId);
  }

  return newMastered;
}

/**
 * Calculates how many questions would be unlocked if given atoms are mastered.
 */
export function simulateQuestionUnlocks(
  atomsToMaster: string[],
  questions: Map<string, QuestionWithAtoms>,
  currentMastered: Set<string>
): {
  newUnlocks: string[];
  totalUnlockedAfter: number;
} {
  const simulatedMastery = simulateMastery(atomsToMaster, currentMastered);

  const newUnlocks: string[] = [];
  let totalUnlockedAfter = 0;

  for (const question of questions.values()) {
    // Skip questions with no primary atoms (can't evaluate)
    if (question.primaryAtomIds.length === 0) continue;

    const wasUnlocked = question.primaryAtomIds.every((id) =>
      currentMastered.has(id)
    );
    const isNowUnlocked = question.primaryAtomIds.every((id) =>
      simulatedMastery.has(id)
    );

    if (isNowUnlocked) {
      totalUnlockedAfter++;
      if (!wasUnlocked) {
        newUnlocks.push(question.id);
      }
    }
  }

  return { newUnlocks, totalUnlockedAfter };
}
