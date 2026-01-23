/**
 * Question Unlock Algorithm - Public API
 *
 * Main entry point for calculating personalized learning routes
 * based on question unlock potential.
 *
 * Usage:
 *   const analysis = await analyzeLearningPotential(diagnosticResults);
 *   console.log(analysis.routes); // Recommended learning paths
 *   console.log(analysis.topAtomsByEfficiency); // Best individual atoms
 */

import {
  loadAllAtoms,
  loadOfficialQuestionsWithAtoms,
  getQuestionAtomStats,
} from "./dataLoader";
import {
  buildMasteryState,
  getMasteredAtomIds,
  analyzeAllQuestions,
  calculateMasterySummary,
  calculateMasteryByAxis,
} from "./masteryAnalyzer";
import { calculateAllMarginalValues } from "./unlockCalculator";
import {
  buildAllRoutes,
  findQuickWins,
  findHighImpactAtoms,
} from "./routeOptimizer";
import type {
  StudentLearningAnalysis,
  LearningRoute,
  AtomMarginalValue,
  QuestionUnlockStatus,
  ScoringConfig,
} from "./types";
import { DEFAULT_SCORING_CONFIG } from "./types";

// Re-export types for consumers
export type {
  StudentLearningAnalysis,
  LearningRoute,
  AtomMarginalValue,
  QuestionUnlockStatus,
  AtomInRoute,
  ScoringConfig,
  AxisMastery,
} from "./types";

export { DEFAULT_SCORING_CONFIG } from "./types";

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyzes a student's learning potential based on diagnostic results.
 * This is the main entry point for the algorithm.
 *
 * @param diagnosticResults - Atoms directly tested with results
 * @param configOverrides - Optional partial config to override defaults
 * @returns Complete analysis with routes and recommendations
 */
export async function analyzeLearningPotential(
  diagnosticResults: Array<{ atomId: string; mastered: boolean }>,
  configOverrides?: Partial<ScoringConfig>
): Promise<StudentLearningAnalysis> {
  // Merge with defaults
  const config: ScoringConfig = {
    ...DEFAULT_SCORING_CONFIG,
    ...configOverrides,
  };
  // Load data
  const [allAtoms, questions] = await Promise.all([
    loadAllAtoms(),
    loadOfficialQuestionsWithAtoms(),
  ]);

  // Build mastery state with transitivity
  const masteryMap = buildMasteryState(diagnosticResults, allAtoms);
  const masteredAtoms = getMasteredAtomIds(masteryMap);

  // Analyze question unlock status
  const questionAnalysis = analyzeAllQuestions(questions, masteredAtoms);

  // Calculate all question statuses for marginal value calculation
  const allStatuses: QuestionUnlockStatus[] = [
    ...questionAnalysis.unlocked,
    ...questionAnalysis.oneAway,
    ...questionAnalysis.twoAway,
    ...questionAnalysis.threeOrMoreAway,
  ];

  // Calculate marginal values for all non-mastered atoms
  const marginalValues = calculateAllMarginalValues(
    allAtoms,
    questions,
    masteryMap,
    allStatuses,
    config
  );

  // Build learning routes by axis
  const routes = buildAllRoutes(
    marginalValues,
    allAtoms,
    questions,
    masteryMap,
    config
  );

  // Get top atoms by efficiency
  const topAtomsByEfficiency = findHighImpactAtoms(marginalValues, 10);

  // Get low-hanging fruit (questions 1-2 atoms away)
  const lowHangingFruit = [
    ...questionAnalysis.oneAway,
    ...questionAnalysis.twoAway,
  ].sort((a, b) => a.atomsToUnlock - b.atomsToUnlock);

  // Calculate summary
  const masterySummary = calculateMasterySummary(masteryMap, questionAnalysis);

  // Calculate mastery breakdown by axis
  const masteryByAxis = calculateMasteryByAxis(masteryMap, allAtoms);

  return {
    summary: {
      totalAtoms: masterySummary.totalAtoms,
      masteredAtoms: masterySummary.masteredAtoms,
      totalQuestions: masterySummary.totalQuestions,
      unlockedQuestions: masterySummary.unlockedQuestions,
      potentialQuestionsToUnlock:
        masterySummary.questionsOneAway + masterySummary.questionsTwoAway,
    },
    masteryByAxis,
    routes,
    topAtomsByEfficiency,
    lowHangingFruit: lowHangingFruit.slice(0, 20),
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Gets quick statistics about question-atom coverage.
 * Useful for debugging and understanding the data.
 */
export async function getStats() {
  return getQuestionAtomStats();
}

/**
 * Analyzes potential for a "fresh" student (no mastery assumed).
 * Useful for understanding the full learning landscape.
 */
export async function analyzeFromScratch(
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): Promise<StudentLearningAnalysis> {
  return analyzeLearningPotential([], config);
}

/**
 * Gets the best single axis to focus on based on question unlock potential.
 */
export async function getBestAxisToFocus(
  diagnosticResults: Array<{ atomId: string; mastered: boolean }>
): Promise<LearningRoute | null> {
  const analysis = await analyzeLearningPotential(diagnosticResults);
  return analysis.routes[0] || null;
}

/**
 * Gets atoms that can be learned immediately (no prerequisites needed)
 * and will unlock at least one question.
 */
export async function getQuickWinAtoms(
  diagnosticResults: Array<{ atomId: string; mastered: boolean }>
): Promise<AtomMarginalValue[]> {
  const analysis = await analyzeLearningPotential(diagnosticResults);
  return findQuickWins(analysis.topAtomsByEfficiency, 5);
}

// ============================================================================
// ROUTE FORMATTING HELPERS
// ============================================================================

/**
 * Formats a learning route for display in the UI.
 * Questions shown are per-test average (total / 4 tests).
 */
export function formatRouteForDisplay(route: LearningRoute): {
  title: string;
  subtitle: string;
  atomCount: number;
  questionsUnlocked: number;
  pointsGain: number;
  studyHours: number;
} {
  const titles: Record<string, { title: string; subtitle: string }> = {
    ALG: {
      title: "Dominio Algebraico",
      subtitle: "Expresiones, ecuaciones y funciones",
    },
    NUM: {
      title: "El Poder de los Números",
      subtitle: "Enteros, fracciones y operaciones",
    },
    GEO: {
      title: "El Ojo Geométrico",
      subtitle: "Figuras, medidas y transformaciones",
    },
    PROB: {
      title: "El Arte de la Probabilidad",
      subtitle: "Datos, probabilidades y estadística",
    },
  };

  const display = titles[route.axis];
  if (!display) {
    throw new Error(`Unknown axis: ${route.axis}`);
  }

  // Show questions per test (average), not total across all tests
  const numTests = DEFAULT_SCORING_CONFIG.numOfficialTests;
  const questionsPerTest = Math.round(route.totalQuestionsUnlocked / numTests);

  return {
    ...display,
    atomCount: route.atoms.length,
    questionsUnlocked: questionsPerTest,
    pointsGain: route.estimatedPointsGain,
    studyHours: Math.round((route.estimatedMinutes / 60) * 10) / 10,
  };
}

import {
  calculateScoreRange,
  capImprovementToMax,
  estimateCorrectFromScore,
  getPaesScore,
  PAES_TOTAL_QUESTIONS,
  IMPROVEMENT_UNCERTAINTY,
  NUM_OFFICIAL_TESTS,
} from "../scoringConstants";
import { calculateImprovement as calcPaesImprovement } from "../paesScoreTable";

/**
 * Calculates PAES score from the number of questions currently unlocked.
 * This provides a consistent score based on atom mastery analysis.
 *
 * Range is calculated using ±5 questions with PAES table lookup,
 * per methodology section 5.1. This allows high performers to reach 1000.
 *
 * @param unlockedQuestions - Total questions unlocked across all tests
 * @param numTests - Number of tests in the database (default from constants)
 * @returns PAES score and the estimated correct answers per test
 * @see docs/diagnostic-score-methodology.md
 */
export function calculatePAESFromUnlocked(
  unlockedQuestions: number,
  numTests: number = NUM_OFFICIAL_TESTS
): {
  score: number;
  min: number;
  max: number;
  correctPerTest: number;
} {
  // Questions are spread across tests, so divide by number of tests
  const correctPerTest = Math.round(unlockedQuestions / numTests);

  // Use the official PAES table
  const score = getPaesScore(correctPerTest);

  // Calculate range using ±5 questions with PAES table (methodology 5.1)
  const range = calculateScoreRange(score);

  return { score, min: range.min, max: range.max, correctPerTest };
}

/**
 * Calculates realistic PAES improvement projection based on questions unlocked.
 *
 * Takes into account (per methodology section 6.2):
 * - Questions are spread across multiple tests (÷4)
 * - The official PAES conversion table (non-linear)
 * - Student's current PAES score (from diagnostic)
 * - Caps improvement to never exceed max PAES score (1000)
 * - Uncertainty factor (±15%) for question selection variance
 *
 * @param currentPaesScore - Current PAES score from diagnostic formula
 * @param additionalQuestionsUnlocked - Additional questions unlocked (total across tests)
 * @param numTests - Number of tests (default from constants)
 * @see docs/diagnostic-score-methodology.md section 6.2
 */
export function calculatePAESImprovement(
  currentPaesScore: number,
  additionalQuestionsUnlocked: number,
  numTests: number = NUM_OFFICIAL_TESTS
): {
  minPoints: number;
  maxPoints: number;
  questionsPerTest: number;
  percentageOfTest: number;
} {
  // Convert current PAES score to estimated correct answers
  const currentCorrect = estimateCorrectFromScore(currentPaesScore);

  // Additional questions are spread across tests
  // Use Math.max(1, ...) when there ARE questions to avoid 0 improvement due to rounding
  const rawPerTest = additionalQuestionsUnlocked / numTests;
  const additionalPerTest =
    additionalQuestionsUnlocked > 0 ? Math.max(1, Math.round(rawPerTest)) : 0;

  // Use actual PAES table for accurate point calculation
  const improvement = calcPaesImprovement(currentCorrect, additionalPerTest);

  // Add uncertainty range (±15%) since question selection varies
  const rawMin = Math.round(
    improvement.improvement * (1 - IMPROVEMENT_UNCERTAINTY)
  );
  const rawMax = Math.round(
    improvement.improvement * (1 + IMPROVEMENT_UNCERTAINTY)
  );

  // Cap improvements to never exceed 1000 from CURRENT score
  const minPoints = capImprovementToMax(currentPaesScore, rawMin);
  const maxPoints = capImprovementToMax(currentPaesScore, rawMax);

  // Percentage of a single test this represents
  const percentageOfTest = Math.round(
    (additionalPerTest / PAES_TOTAL_QUESTIONS) * 100
  );

  return {
    minPoints,
    maxPoints,
    questionsPerTest: additionalPerTest,
    percentageOfTest,
  };
}
