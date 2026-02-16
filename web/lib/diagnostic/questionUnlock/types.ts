/**
 * Question Unlock Algorithm - Type Definitions
 *
 * Types for calculating optimal learning routes based on question unlock potential.
 * Uses centralized scoring constants for methodology alignment.
 *
 * @see docs/diagnostic-score-methodology.md
 */

import {
  UNLOCK_WEIGHTS,
  MINUTES_PER_ATOM,
  NUM_OFFICIAL_TESTS,
} from "../scoringConstants";

// Re-export shared mastery types from the canonical source
export type {
  MasteryState as AtomMasteryState,
  MasterySource,
  AtomWithPrereqs as AtomWithPrereqsBase,
} from "../atomMastery";

// ============================================================================
// CORE DATA TYPES
// ============================================================================

/** Atom with its prerequisite dependencies and metadata for unlock algorithm */
export interface AtomWithPrereqs {
  id: string;
  axis: string;
  title: string;
  prerequisiteIds: string[];
}

/** Question with its atom requirements */
export interface QuestionWithAtoms {
  id: string;
  source: string;
  difficultyLevel: string;
  /** Atoms required to answer this question (primary relevance) */
  primaryAtomIds: string[];
  /** Atoms that help but aren't strictly required (secondary relevance) */
  secondaryAtomIds: string[];
}

// ============================================================================
// ANALYSIS RESULTS
// ============================================================================

/** Analysis of a question's unlock status for a student */
export interface QuestionUnlockStatus {
  questionId: string;
  /** Is the question already unlocked (all primary atoms mastered)? */
  isUnlocked: boolean;
  /** Primary atoms the student is missing */
  missingPrimaryAtoms: string[];
  /** How many atoms away from being unlocked */
  atomsToUnlock: number;
  /** Secondary atoms that would help (not required) */
  missingSecondaryAtoms: string[];
}

/** Marginal value of mastering a single atom */
export interface AtomMarginalValue {
  atomId: string;
  axis: string;
  title: string;
  /**
   * Questions that become unlocked IMMEDIATELY when this atom is mastered.
   * These are questions where this atom is the ONLY missing primary atom.
   */
  immediateUnlocks: string[];
  /**
   * Questions that get closer to being unlocked (this atom is one of several missing).
   * Map of questionId -> remaining atoms needed after mastering this one.
   */
  progressContributions: Map<string, number>;
  /**
   * Score representing the total unlock potential.
   * Higher = more valuable to learn.
   */
  unlockScore: number;
  /**
   * Prerequisites this atom needs that the student hasn't mastered.
   * Empty if atom can be learned immediately.
   */
  prerequisitesNeeded: string[];
  /**
   * Total "cost" to unlock this atom (1 + missing prerequisites).
   * Used to calculate efficiency: unlockScore / totalCost.
   */
  totalCost: number;
  /** Efficiency = unlockScore / totalCost */
  efficiency: number;
}

// ============================================================================
// LEARNING ROUTES
// ============================================================================

/** A recommended learning path */
export interface LearningRoute {
  axis: string;
  axisDisplayName: string;
  /** Atoms to study in recommended order */
  atoms: AtomInRoute[];
  /** Total questions unlocked by completing this route */
  totalQuestionsUnlocked: number;
  /** Estimated PAES points improvement */
  estimatedPointsGain: number;
  /** Estimated study time in minutes */
  estimatedMinutes: number;
}

/** An atom within a learning route */
export interface AtomInRoute {
  atomId: string;
  title: string;
  /** Position in the learning sequence (1-based) */
  position: number;
  /** Questions unlocked at this point in the route */
  questionsUnlockedHere: number;
  /** Cumulative questions unlocked up to this point */
  cumulativeQuestionsUnlocked: number;
  /** Is this a prerequisite for later atoms in the route? */
  isPrerequisite: boolean;
}

/** Mastery breakdown for a single axis */
export interface AxisMastery {
  axis: string;
  totalAtoms: number;
  masteredAtoms: number;
  masteryPercentage: number;
}

/** Complete analysis result for a student */
export interface StudentLearningAnalysis {
  /** Student's current state */
  summary: {
    totalAtoms: number;
    masteredAtoms: number;
    totalQuestions: number;
    unlockedQuestions: number;
    potentialQuestionsToUnlock: number;
  };
  /** Mastery breakdown by axis (atoms mastered via transitivity) */
  masteryByAxis: AxisMastery[];
  /** Recommended learning routes by axis */
  routes: LearningRoute[];
  /** Top individual atoms ranked by efficiency */
  topAtomsByEfficiency: AtomMarginalValue[];
  /** Questions closest to being unlocked (1-2 atoms away) */
  lowHangingFruit: QuestionUnlockStatus[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Weights for calculating unlock scores */
export interface ScoringConfig {
  /** Weight for questions where atom is the only missing piece */
  immediateUnlockWeight: number;
  /** Weight for questions where atom is one of 2 missing pieces */
  twoAwayWeight: number;
  /** Weight for questions where atom is one of 3+ missing pieces */
  threeOrMoreWeight: number;
  /** Bonus multiplier for primary relevance (secondary = 1.0) */
  primaryRelevanceMultiplier: number;
  /** Estimated minutes to master one atom */
  minutesPerAtom: number;
  /**
   * Number of official tests in database.
   * Used to convert total questions unlocked to per-test improvement.
   * Questions are spread across tests, so real improvement = total / numTests
   */
  numOfficialTests: number;
  /**
   * Student's current PAES score from diagnostic formula.
   * Used to calculate and cap improvements so total never exceeds 1000.
   */
  currentPaesScore?: number;
}

/** Default scoring configuration using centralized constants */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  immediateUnlockWeight: UNLOCK_WEIGHTS.immediateUnlock,
  twoAwayWeight: UNLOCK_WEIGHTS.twoAway,
  threeOrMoreWeight: UNLOCK_WEIGHTS.threeOrMore,
  primaryRelevanceMultiplier: UNLOCK_WEIGHTS.primaryRelevanceMultiplier,
  minutesPerAtom: MINUTES_PER_ATOM,
  numOfficialTests: NUM_OFFICIAL_TESTS,
};
