/**
 * Question Unlock Algorithm - Mastery Analyzer
 *
 * Analyzes a student's current mastery state to determine:
 * - Which atoms are mastered (directly or via transitivity)
 * - Which questions are currently unlocked
 * - Which questions are close to being unlocked
 */

import type {
  AtomWithPrereqs,
  QuestionWithAtoms,
  AtomMasteryState,
  QuestionUnlockStatus,
} from "./types";

// ============================================================================
// MASTERY STATE BUILDER
// ============================================================================

/**
 * Builds a complete mastery state map from diagnostic results.
 * Applies transitivity: if advanced atom is mastered, prerequisites are too.
 *
 * @param directResults - Atoms directly tested in diagnostic
 * @param allAtoms - Map of all atoms with their prerequisites
 * @returns Map of atomId -> mastery state
 */
export function buildMasteryState(
  directResults: Array<{ atomId: string; mastered: boolean }>,
  allAtoms: Map<string, AtomWithPrereqs>
): Map<string, AtomMasteryState> {
  const masteryMap = new Map<string, AtomMasteryState>();

  // Step 1: Mark directly tested atoms
  for (const result of directResults) {
    masteryMap.set(result.atomId, {
      atomId: result.atomId,
      mastered: result.mastered,
      source: "direct",
    });
  }

  // Step 2: Apply transitivity for mastered atoms
  // If atom X is mastered, all its prerequisites are mastered too
  const visited = new Set<string>();

  function markPrerequisitesAsMastered(atomId: string): void {
    if (visited.has(atomId)) return;
    visited.add(atomId);

    const atom = allAtoms.get(atomId);
    if (!atom) return;

    for (const prereqId of atom.prerequisiteIds) {
      const current = masteryMap.get(prereqId);

      // Don't override direct test results
      if (current?.source === "direct") {
        if (current.mastered) {
          markPrerequisitesAsMastered(prereqId);
        }
        continue;
      }

      // Mark as inferred mastered
      masteryMap.set(prereqId, {
        atomId: prereqId,
        mastered: true,
        source: "inferred",
      });

      markPrerequisitesAsMastered(prereqId);
    }
  }

  for (const result of directResults) {
    if (result.mastered) {
      markPrerequisitesAsMastered(result.atomId);
    }
  }

  // Step 3: All remaining atoms are not_tested
  for (const [atomId] of allAtoms) {
    if (!masteryMap.has(atomId)) {
      masteryMap.set(atomId, {
        atomId,
        mastered: false,
        source: "not_tested",
      });
    }
  }

  return masteryMap;
}

/**
 * Gets the set of mastered atom IDs for quick lookups.
 */
export function getMasteredAtomIds(
  masteryMap: Map<string, AtomMasteryState>
): Set<string> {
  const mastered = new Set<string>();

  for (const [atomId, state] of masteryMap) {
    if (state.mastered) {
      mastered.add(atomId);
    }
  }

  return mastered;
}

/**
 * Gets the set of non-mastered atom IDs.
 */
export function getNonMasteredAtomIds(
  masteryMap: Map<string, AtomMasteryState>
): Set<string> {
  const nonMastered = new Set<string>();

  for (const [atomId, state] of masteryMap) {
    if (!state.mastered) {
      nonMastered.add(atomId);
    }
  }

  return nonMastered;
}

// ============================================================================
// QUESTION UNLOCK ANALYSIS
// ============================================================================

/**
 * Analyzes unlock status for a single question given current mastery.
 */
export function analyzeQuestionUnlock(
  question: QuestionWithAtoms,
  masteredAtoms: Set<string>
): QuestionUnlockStatus {
  const missingPrimary = question.primaryAtomIds.filter(
    (atomId) => !masteredAtoms.has(atomId)
  );

  const missingSecondary = question.secondaryAtomIds.filter(
    (atomId) => !masteredAtoms.has(atomId)
  );

  return {
    questionId: question.id,
    isUnlocked: missingPrimary.length === 0,
    missingPrimaryAtoms: missingPrimary,
    atomsToUnlock: missingPrimary.length,
    missingSecondaryAtoms: missingSecondary,
  };
}

/**
 * Analyzes unlock status for all questions.
 * Returns questions grouped by their unlock status.
 */
export function analyzeAllQuestions(
  questions: Map<string, QuestionWithAtoms>,
  masteredAtoms: Set<string>
): {
  unlocked: QuestionUnlockStatus[];
  oneAway: QuestionUnlockStatus[];
  twoAway: QuestionUnlockStatus[];
  threeOrMoreAway: QuestionUnlockStatus[];
  noMapping: QuestionUnlockStatus[];
} {
  const result = {
    unlocked: [] as QuestionUnlockStatus[],
    oneAway: [] as QuestionUnlockStatus[],
    twoAway: [] as QuestionUnlockStatus[],
    threeOrMoreAway: [] as QuestionUnlockStatus[],
    noMapping: [] as QuestionUnlockStatus[],
  };

  for (const question of questions.values()) {
    const status = analyzeQuestionUnlock(question, masteredAtoms);

    // Questions with no primary atoms mapped are special case
    if (question.primaryAtomIds.length === 0) {
      result.noMapping.push(status);
      continue;
    }

    if (status.isUnlocked) {
      result.unlocked.push(status);
    } else if (status.atomsToUnlock === 1) {
      result.oneAway.push(status);
    } else if (status.atomsToUnlock === 2) {
      result.twoAway.push(status);
    } else {
      result.threeOrMoreAway.push(status);
    }
  }

  return result;
}

/**
 * Calculates mastery summary statistics.
 */
export function calculateMasterySummary(
  masteryMap: Map<string, AtomMasteryState>,
  questionAnalysis: ReturnType<typeof analyzeAllQuestions>
): {
  totalAtoms: number;
  masteredAtoms: number;
  masteryPercentage: number;
  directlyTested: number;
  inferredMastery: number;
  totalQuestions: number;
  unlockedQuestions: number;
  questionsOneAway: number;
  questionsTwoAway: number;
} {
  let mastered = 0;
  let directlyTested = 0;
  let inferred = 0;

  for (const state of masteryMap.values()) {
    if (state.mastered) {
      mastered++;
      if (state.source === "direct") directlyTested++;
      if (state.source === "inferred") inferred++;
    }
  }

  const totalQuestions =
    questionAnalysis.unlocked.length +
    questionAnalysis.oneAway.length +
    questionAnalysis.twoAway.length +
    questionAnalysis.threeOrMoreAway.length +
    questionAnalysis.noMapping.length;

  return {
    totalAtoms: masteryMap.size,
    masteredAtoms: mastered,
    masteryPercentage:
      masteryMap.size > 0 ? Math.round((mastered / masteryMap.size) * 100) : 0,
    directlyTested,
    inferredMastery: inferred,
    totalQuestions,
    unlockedQuestions: questionAnalysis.unlocked.length,
    questionsOneAway: questionAnalysis.oneAway.length,
    questionsTwoAway: questionAnalysis.twoAway.length,
  };
}
