/**
 * Official PAES M1 Score Conversion Table
 *
 * Based on the most recent PAES administration.
 * Maps number of correct answers to PAES score.
 *
 * Note: The conversion is non-linear - higher scores require
 * proportionally more correct answers.
 */

export const PAES_SCORE_TABLE: Record<number, number> = {
  0: 100,
  1: 170,
  2: 194,
  3: 216,
  4: 236,
  5: 256,
  6: 275,
  7: 292,
  8: 307,
  9: 320,
  10: 334,
  11: 349,
  12: 365,
  13: 380,
  14: 393,
  15: 403,
  16: 412,
  17: 421,
  18: 432,
  19: 446,
  20: 460,
  21: 474,
  22: 486,
  23: 495,
  24: 502,
  25: 508,
  26: 516,
  27: 526,
  28: 539,
  29: 553,
  30: 567,
  31: 579,
  32: 587,
  33: 595,
  34: 601,
  35: 609,
  36: 618,
  37: 631,
  38: 645,
  39: 660,
  40: 672,
  41: 682,
  42: 690,
  43: 699,
  44: 710,
  45: 723,
  46: 738,
  47: 753,
  48: 767,
  49: 780,
  50: 793,
  51: 807,
  52: 824,
  53: 842,
  54: 861,
  55: 880,
  56: 900,
  57: 923,
  58: 948,
  59: 975,
  60: 1000,
};

/** Total questions in a PAES M1 test */
export const PAES_TOTAL_QUESTIONS = 60;

/** Minimum PAES score */
export const PAES_MIN_SCORE = 100;

/** Maximum PAES score */
export const PAES_MAX_SCORE = 1000;

/**
 * Gets the PAES score for a given number of correct answers.
 * Interpolates for values not in the table.
 */
export function getPaesScore(correctAnswers: number): number {
  const clamped = Math.max(0, Math.min(60, Math.round(correctAnswers)));
  const score = PAES_SCORE_TABLE[clamped];
  if (score === undefined) {
    throw new Error(`No PAES score entry for ${clamped} correct answers`);
  }
  return score;
}

/**
 * Calculates the point improvement from adding more correct answers.
 * Uses the actual PAES conversion table for accuracy.
 *
 * @param currentCorrect - Current number of correct answers
 * @param additionalCorrect - Number of additional correct answers
 * @returns Point improvement and new score
 */
export function calculateImprovement(
  currentCorrect: number,
  additionalCorrect: number
): {
  currentScore: number;
  newScore: number;
  improvement: number;
  newCorrect: number;
} {
  const current = Math.max(0, Math.min(60, Math.round(currentCorrect)));
  const newCorrect = Math.min(60, current + additionalCorrect);

  const currentScore = getPaesScore(current);
  const newScore = getPaesScore(newCorrect);

  return {
    currentScore,
    newScore,
    improvement: newScore - currentScore,
    newCorrect,
  };
}

/**
 * Estimates how many correct answers correspond to a given PAES score.
 * Useful for converting a score back to questions.
 */
export function estimateCorrectFromScore(paesScore: number): number {
  // Find the closest entry
  let closest = 0;
  let minDiff = Math.abs(PAES_SCORE_TABLE[0] - paesScore);

  for (let i = 1; i <= 60; i++) {
    const diff = Math.abs(PAES_SCORE_TABLE[i] - paesScore);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }

  return closest;
}

/**
 * Caps improvement to ensure score never exceeds PAES_MAX_SCORE (1000).
 * Use this whenever displaying or calculating improvement values.
 *
 * @param currentScore - Student's current PAES score
 * @param improvement - Raw improvement value
 * @returns Capped improvement that won't exceed max score
 */
export function capImprovementToMax(
  currentScore: number,
  improvement: number
): number {
  const maxPossibleImprovement = PAES_MAX_SCORE - currentScore;
  return Math.max(0, Math.min(improvement, maxPossibleImprovement));
}
