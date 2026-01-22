/**
 * Hook for fetching personalized learning routes based on diagnostic results.
 * Uses the Question Unlock Algorithm to calculate optimal learning paths.
 */

import { useState, useEffect } from "react";

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

export interface LearningRoutesResponse {
  summary: {
    totalAtoms: number;
    masteredAtoms: number;
    totalQuestions: number;
    unlockedQuestions: number;
    potentialQuestionsToUnlock: number;
  };
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
 */
export function getFallbackRoutes(): LearningRoutesResponse {
  return {
    summary: {
      totalAtoms: 229,
      masteredAtoms: 0,
      totalQuestions: 202,
      unlockedQuestions: 0,
      potentialQuestionsToUnlock: 120,
    },
    routes: [
      {
        axis: "ALG",
        title: "Dominio Algebraico",
        subtitle: "Expresiones, ecuaciones y funciones",
        atomCount: 10,
        questionsUnlocked: 45,
        pointsGain: 45,
        studyHours: 3.5,
        atoms: [],
      },
      {
        axis: "NUM",
        title: "El Poder de los Números",
        subtitle: "Enteros, fracciones y operaciones",
        atomCount: 8,
        questionsUnlocked: 22,
        pointsGain: 30,
        studyHours: 2.5,
        atoms: [],
      },
      {
        axis: "GEO",
        title: "El Ojo Geométrico",
        subtitle: "Figuras, medidas y transformaciones",
        atomCount: 7,
        questionsUnlocked: 15,
        pointsGain: 22,
        studyHours: 2.5,
        atoms: [],
      },
      {
        axis: "PROB",
        title: "El Arte de la Probabilidad",
        subtitle: "Datos, probabilidades y estadística",
        atomCount: 6,
        questionsUnlocked: 18,
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
 * @param atomResults - Array of {atomId, mastered} from diagnostic
 * @returns Loading state, data, and any errors
 */
export function useLearningRoutes(
  atomResults: Array<{ atomId: string; mastered: boolean }>
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
          body: JSON.stringify({ atomResults }),
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
  }, [atomResults]);

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
