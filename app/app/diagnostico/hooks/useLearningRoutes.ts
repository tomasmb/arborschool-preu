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

import { useState, useEffect, useRef } from "react";

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

  // Stabilize atomResults reference - only change when content changes
  const atomResultsKey = JSON.stringify(atomResults);
  const stableAtomResults = useRef(atomResults);
  if (JSON.stringify(stableAtomResults.current) !== atomResultsKey) {
    stableAtomResults.current = atomResults;
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchRoutes() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/diagnostic/learning-routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            atomResults: stableAtomResults.current,
            diagnosticScore,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!cancelled) {
          if (result.success && result.data) {
            setData(result.data);
          } else {
            // Don't use fallback - show error so students don't see fake data
            console.error("Learning routes API returned error:", result.error);
            setError(result.error || "Error al calcular rutas de aprendizaje");
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch learning routes:", err);
          setError(err instanceof Error ? err.message : "Error de conexión");
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
  }, [atomResultsKey, diagnosticScore]);

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
