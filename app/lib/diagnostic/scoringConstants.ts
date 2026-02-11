/**
 * Centralized Scoring Constants and Utilities
 *
 * Single source of truth for all score-related constants and calculations.
 * Based on docs/diagnostic-score-methodology.md
 *
 * Key principles from methodology:
 * 1. Score calculation uses weighted formula with route factors
 * 2. Range calculation uses ±5 questions with PAES table (not fixed points)
 * 3. Improvements are capped to never exceed 1000 total
 * 4. Transitivity includes BOTH primary AND secondary atoms
 */

import {
  PAES_SCORE_TABLE,
  PAES_MIN_SCORE,
  PAES_MAX_SCORE,
  PAES_TOTAL_QUESTIONS,
  getPaesScore,
  estimateCorrectFromScore,
  capImprovementToMax,
} from "./paesScoreTable";

// Re-export PAES table utilities for convenience
export {
  PAES_SCORE_TABLE,
  PAES_MIN_SCORE,
  PAES_MAX_SCORE,
  PAES_TOTAL_QUESTIONS,
  getPaesScore,
  estimateCorrectFromScore,
  capImprovementToMax,
};

// ============================================================================
// SCORE CALCULATION CONSTANTS (from methodology section 6.1)
// ============================================================================

/** Weight for low difficulty questions (difficulty <= 0.35) */
export const WEIGHT_LOW = 1.0;

/** Weight for medium/high difficulty questions (difficulty > 0.35) */
export const WEIGHT_MEDIUM = 1.8;

/** Difficulty threshold for weight selection */
export const DIFFICULTY_THRESHOLD = 0.35;

/**
 * Route factors for MST routing (A/B/C).
 * Higher route = harder questions = higher factor
 */
export const FACTOR_ROUTE = {
  A: 0.7,
  B: 0.85,
  C: 1.0,
} as const;

export type Route = keyof typeof FACTOR_ROUTE;

/**
 * Coverage factor to account for ~10% of atoms not inferrable from diagnostic.
 * Diagnostic covers 55-64% of atoms with transitivity (per methodology)
 */
export const FACTOR_COVERAGE = 0.9;

/**
 * Range calculation: ±5 questions (per methodology section 5.1)
 * This allows high performers to reach 1000 at the top of their range
 */
export const RANGE_QUESTIONS = 5;

// ============================================================================
// IMPROVEMENT CALCULATION CONSTANTS
// ============================================================================

/**
 * Uncertainty factor for improvement projections (±15%).
 * Accounts for variation in which questions appear on actual tests.
 */
export const IMPROVEMENT_UNCERTAINTY = 0.15;

/** Number of official PAES tests in the database */
export const NUM_OFFICIAL_TESTS = 4;

// ============================================================================
// SCORING CONFIG (for unlock calculator)
// ============================================================================

/** Weights for calculating unlock scores */
export const UNLOCK_WEIGHTS = {
  /** Weight for questions where atom is the only missing piece */
  immediateUnlock: 10.0,
  /** Weight for questions where atom is one of 2 missing pieces */
  twoAway: 3.0,
  /** Weight for questions where atom is one of 3+ missing pieces */
  threeOrMore: 1.0,
  /** Bonus multiplier for primary relevance (secondary = 1.0) */
  primaryRelevanceMultiplier: 2.0,
} as const;

/** Estimated minutes to master one atom */
export const MINUTES_PER_ATOM = 20;

// ============================================================================
// SCORE CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate the weight for a question based on its difficulty.
 * Low difficulty (≤ 0.35) = WEIGHT_LOW
 * Medium/High difficulty (> 0.35) = WEIGHT_MEDIUM
 */
export function getQuestionWeight(difficulty: number): number {
  return difficulty <= DIFFICULTY_THRESHOLD ? WEIGHT_LOW : WEIGHT_MEDIUM;
}

/**
 * Calculate the route factor for score extrapolation.
 */
export function getRouteFactor(route: Route): number {
  return FACTOR_ROUTE[route];
}

/**
 * Calculate score range using ±5 questions with PAES table lookup.
 * This is the methodology-compliant approach (section 5.1).
 *
 * @param score - The calculated PAES score
 * @returns min and max score based on ±5 questions
 */
export function calculateScoreRange(score: number): {
  min: number;
  max: number;
} {
  const estimatedCorrect = estimateCorrectFromScore(score);
  const minCorrect = Math.max(0, estimatedCorrect - RANGE_QUESTIONS);
  const maxCorrect = Math.min(
    PAES_TOTAL_QUESTIONS,
    estimatedCorrect + RANGE_QUESTIONS
  );

  return {
    min: Math.max(PAES_MIN_SCORE, getPaesScore(minCorrect)),
    max: Math.min(PAES_MAX_SCORE, getPaesScore(maxCorrect)),
  };
}

/**
 * Calculate the main PAES score from diagnostic responses.
 * Formula: 100 + 900 × normalizedScore × FACTOR_ROUTE × FACTOR_COVERAGE
 *
 * @param route - The MST route (A, B, or C)
 * @param responses - Array of response objects with correct flag and difficulty
 * @returns Calculated PAES score (rounded to nearest integer)
 */
export function calculateRawPaesScore(
  route: Route,
  responses: Array<{ correct: boolean; difficulty: number }>
): number {
  let weightedScore = 0;
  let maxWeightedScore = 0;

  for (const response of responses) {
    const weight = getQuestionWeight(response.difficulty);
    maxWeightedScore += weight;
    if (response.correct) {
      weightedScore += weight;
    }
  }

  const normalizedScore =
    maxWeightedScore > 0 ? weightedScore / maxWeightedScore : 0;
  const routeFactor = getRouteFactor(route);

  // Formula from methodology section 6.1
  const paesRaw =
    PAES_MIN_SCORE + 900 * normalizedScore * routeFactor * FACTOR_COVERAGE;

  return Math.round(paesRaw);
}
