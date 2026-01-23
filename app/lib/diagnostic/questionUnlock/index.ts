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

  return {
    summary: {
      totalAtoms: masterySummary.totalAtoms,
      masteredAtoms: masterySummary.masteredAtoms,
      totalQuestions: masterySummary.totalQuestions,
      unlockedQuestions: masterySummary.unlockedQuestions,
      potentialQuestionsToUnlock:
        masterySummary.questionsOneAway + masterySummary.questionsTwoAway,
    },
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

  const display = titles[route.axis] || {
    title: route.axisDisplayName,
    subtitle: "Dominio temático",
  };

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
  calculateImprovement as calcPaesImprovement,
  capImprovementToMax,
  getPaesScore,
  PAES_TOTAL_QUESTIONS,
} from "../paesScoreTable";

/**
 * Calculates PAES score from the number of questions currently unlocked.
 * This provides a consistent score based on atom mastery analysis.
 *
 * @param unlockedQuestions - Total questions unlocked across all tests
 * @param numTests - Number of tests in the database (default: 4)
 * @returns PAES score and the estimated correct answers per test
 */
export function calculatePAESFromUnlocked(
  unlockedQuestions: number,
  numTests: number = 4
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

  // Add uncertainty margin (±30 points) to account for:
  // - Questions not in database that student might know
  // - Careless errors on questions they could answer
  const margin = 30;
  const min = Math.max(100, score - margin);
  const max = Math.min(1000, score + margin);

  return { score, min, max, correctPerTest };
}

/**
 * Calculates realistic PAES improvement projection based on questions unlocked.
 * Takes into account:
 * - Questions are spread across multiple tests
 * - The official PAES conversion table (non-linear)
 * - Student's current correct answers (derived from unlocked questions)
 * - Caps improvement to never exceed max PAES score (1000)
 *
 * @param currentCorrectPerTest - Current correct answers per test (from unlocked questions)
 * @param additionalQuestionsUnlocked - Additional questions unlocked by a route (total across tests)
 * @param numTests - Number of tests (default: 4)
 */
export function calculatePAESImprovement(
  currentCorrectPerTest: number,
  additionalQuestionsUnlocked: number,
  numTests: number = 4
): {
  minPoints: number;
  maxPoints: number;
  questionsPerTest: number;
  percentageOfTest: number;
} {
  // Additional questions are spread across tests
  const additionalPerTest = Math.round(additionalQuestionsUnlocked / numTests);

  // Use actual PAES table for accurate point calculation
  const currentScore = getPaesScore(currentCorrectPerTest);
  const improvement = calcPaesImprovement(
    currentCorrectPerTest,
    additionalPerTest
  );

  // Add uncertainty range (±15%) since question selection varies
  const uncertaintyFactor = 0.15;
  const rawMin = Math.round(improvement.improvement * (1 - uncertaintyFactor));
  const rawMax = Math.round(improvement.improvement * (1 + uncertaintyFactor));

  // Cap improvements to never exceed 1000
  const minPoints = capImprovementToMax(currentScore, rawMin);
  const maxPoints = capImprovementToMax(currentScore, rawMax);

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
