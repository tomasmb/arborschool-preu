/**
 * Hook for fetching personalized learning routes based on diagnostic results.
 * Uses the Question Unlock Algorithm to calculate optimal learning paths.
 *
 * IMPORTANT: The PAES score is calculated from unlocked questions using
 * the official PAES conversion table. This ensures consistency between
 * the estimated score and the improvement predictions.
 *
 * @see docs/diagnostic-score-methodology.md
 */

import { useState, useEffect } from "react";
import { TOTAL_ATOMS } from "@/lib/diagnostic/scoringConstants";

// ============================================================================
// TYPES
// ============================================================================

export interface LearningRouteData {
  axis: string;
  title: string;
  subtitle: string;
  atomCount: number;
  questionsUnlocked: number;
  pointsGain: number;
  studyHours: number;
  atoms: Array<{
    id: string;
    title: string;
    questionsUnlocked: number;
    isPrerequisite: boolean;
  }>;
}

export interface QuickWin {
  atomId: string;
  title: string;
  axis: string;
  questionsUnlocked: number;
}

/** Mastery breakdown for a single axis (calculated via transitivity) */
export interface AxisMasteryData {
  axis: string;
  totalAtoms: number;
  masteredAtoms: number;
  masteryPercentage: number;
}

export interface LearningRoutesResponse {
  summary: {
    totalAtoms: number;
    masteredAtoms: number;
    totalQuestions: number;
    unlockedQuestions: number;
    potentialQuestionsToUnlock: number;
  };
  /** Mastery breakdown by axis (atoms mastered via transitivity) */
  masteryByAxis?: AxisMasteryData[];
  routes: LearningRouteData[];
  quickWins: QuickWin[];
  improvement: {
    minPoints: number;
    maxPoints: number;
    /** Average questions unlocked per test (not total across all tests) */
    questionsPerTest: number;
    /** Percentage of a single test this improvement represents */
    percentageOfTest: number;
  };
  lowHangingFruit: {
    oneAway: number;
    twoAway: number;
  };
}

interface UseLearningRoutesResult {
  data: LearningRoutesResponse | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

/**
 * Fallback data when API is unavailable.
 * Uses reasonable estimates based on typical diagnostic results.
 * Note: questionsUnlocked is per-test average (not total across all tests).
 */
export function getFallbackRoutes(): LearningRoutesResponse {
  return {
    summary: {
      totalAtoms: TOTAL_ATOMS,
      masteredAtoms: 0,
      totalQuestions: 202,
      unlockedQuestions: 0,
      potentialQuestionsToUnlock: 30,
    },
    routes: [
      {
        axis: "ALG",
        title: "Dominio Algebraico",
        subtitle: "Expresiones, ecuaciones y funciones",
        atomCount: 10,
        questionsUnlocked: 11,
        pointsGain: 45,
        studyHours: 3.5,
        atoms: [],
      },
      {
        axis: "NUM",
        title: "El Poder de los Números",
        subtitle: "Enteros, fracciones y operaciones",
        atomCount: 8,
        questionsUnlocked: 5,
        pointsGain: 30,
        studyHours: 2.5,
        atoms: [],
      },
      {
        axis: "GEO",
        title: "El Ojo Geométrico",
        subtitle: "Figuras, medidas y transformaciones",
        atomCount: 7,
        questionsUnlocked: 4,
        pointsGain: 22,
        studyHours: 2.5,
        atoms: [],
      },
      {
        axis: "PROB",
        title: "El Arte de la Probabilidad",
        subtitle: "Datos, probabilidades y estadística",
        atomCount: 6,
        questionsUnlocked: 4,
        pointsGain: 25,
        studyHours: 2,
        atoms: [],
      },
    ],
    quickWins: [],
    improvement: {
      minPoints: 80,
      maxPoints: 120,
      questionsPerTest: 8,
      percentageOfTest: 16,
    },
    lowHangingFruit: {
      oneAway: 20,
      twoAway: 35,
    },
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Fetches learning routes based on atom mastery results from diagnostic.
 *
 * Route improvements are calculated using the PAES table relative to the
 * provided diagnostic score. This ensures improvements are properly capped
 * and don't exceed 1000 total points.
 *
 * @param atomResults - Array of {atomId, mastered} from diagnostic
 * @param diagnosticScore - Current PAES score from diagnostic (for improvement calc)
 * @returns Loading state, data, and any errors
 */
export function useLearningRoutes(
  atomResults: Array<{ atomId: string; mastered: boolean }>,
  diagnosticScore?: number
): UseLearningRoutesResult {
  const [data, setData] = useState<LearningRoutesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRoutes() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/diagnostic/learning-routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ atomResults, diagnosticScore }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!cancelled) {
          if (result.success && result.data) {
            setData(result.data);
          } else {
            // Use fallback if API returns error
            console.warn("Using fallback learning routes:", result.error);
            setData(getFallbackRoutes());
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch learning routes:", err);
          setError(err instanceof Error ? err.message : "Unknown error");
          // Use fallback data on error
          setData(getFallbackRoutes());
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRoutes();

    return () => {
      cancelled = true;
    };
  }, [atomResults, diagnosticScore]);

  return { data, isLoading, error };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sorts routes by their impact (questions unlocked), highest first.
 */
export function sortRoutesByImpact(
  routes: LearningRouteData[]
): LearningRouteData[] {
  return [...routes].sort((a, b) => b.questionsUnlocked - a.questionsUnlocked);
}

/**
 * Gets the recommended route (highest impact).
 */
export function getRecommendedRoute(
  routes: LearningRouteData[]
): LearningRouteData | null {
  const sorted = sortRoutesByImpact(routes);
  return sorted[0] || null;
}

/**
 * Calculates total potential improvement from all routes.
 */
export function calculateTotalPotential(routes: LearningRouteData[]): {
  totalAtoms: number;
  totalQuestions: number;
  totalPoints: number;
  totalHours: number;
} {
  return routes.reduce(
    (acc, route) => ({
      totalAtoms: acc.totalAtoms + route.atomCount,
      totalQuestions: acc.totalQuestions + route.questionsUnlocked,
      totalPoints: acc.totalPoints + route.pointsGain,
      totalHours: acc.totalHours + route.studyHours,
    }),
    { totalAtoms: 0, totalQuestions: 0, totalPoints: 0, totalHours: 0 }
  );
}
