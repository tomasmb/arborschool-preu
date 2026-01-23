/**
 * Question Unlock Algorithm - Mastery Analyzer
 *
 * Analyzes a student's current mastery state to determine:
 * - Which atoms are mastered (directly or via transitivity)
 * - Which questions are currently unlocked
 * - Which questions are close to being unlocked
 *
 * Note: Mastery computation delegates to the shared atomMastery module
 * to maintain a single source of truth for transitivity logic.
 */

import type {
  AtomWithPrereqs,
  QuestionWithAtoms,
  AtomMasteryState,
  QuestionUnlockStatus,
} from "./types";
import {
  computeMasteryAsMap,
  getMasteredAtomIds as getMasteredAtomIdsBase,
  getNonMasteredAtomIds as getNonMasteredAtomIdsBase,
  type MasteryState,
} from "../atomMastery";

// ============================================================================
// MASTERY STATE BUILDER (delegates to shared module)
// ============================================================================

/**
 * Builds a complete mastery state map from diagnostic results.
 * Applies transitivity: if advanced atom is mastered, prerequisites are too.
 *
 * This is a wrapper around the shared atomMastery module to maintain
 * backward compatibility with the questionUnlock API.
 */
export function buildMasteryState(
  directResults: Array<{ atomId: string; mastered: boolean }>,
  allAtoms: Map<string, AtomWithPrereqs>
): Map<string, AtomMasteryState> {
  // The shared module accepts AtomWithPrereqs with just id and prerequisiteIds
  // Our AtomWithPrereqs has additional fields (axis, title) which is fine
  // due to TypeScript's structural typing
  return computeMasteryAsMap(
    directResults,
    allAtoms as Map<string, { id: string; prerequisiteIds: string[] | null }>
  );
}

/**
 * Gets the set of mastered atom IDs for quick lookups.
 */
export function getMasteredAtomIds(
  masteryMap: Map<string, AtomMasteryState>
): Set<string> {
  return getMasteredAtomIdsBase(masteryMap as Map<string, MasteryState>);
}

/**
 * Gets the set of non-mastered atom IDs.
 */
export function getNonMasteredAtomIds(
  masteryMap: Map<string, AtomMasteryState>
): Set<string> {
  return getNonMasteredAtomIdsBase(masteryMap as Map<string, MasteryState>);
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
