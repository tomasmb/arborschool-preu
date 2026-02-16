"use client";

import {
  getResponsesForReview,
  reconstructFullResponses,
  getActualRouteFromStorage,
  getResponseCounts,
} from "@/lib/diagnostic/storage";
import {
  calculateDiagnosticResults,
  computeAtomMastery,
} from "@/lib/diagnostic/resultsCalculator";
import { type useDiagnosticFlow } from "../hooks/useDiagnosticFlow";
import { ResultsScreen } from "./ResultsScreen";
import { MaintenanceScreen } from "./MaintenanceScreen";

// ============================================================================
// TYPES
// ============================================================================

interface ResultsScreenWrapperProps {
  flow: ReturnType<typeof useDiagnosticFlow>;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Resolves results data from either cached state (after profile save)
 * or localStorage (on session restore), then renders ResultsScreen.
 */
export function ResultsScreenWrapper({ flow }: ResultsScreenWrapperProps) {
  // After profile save, localStorage is cleared — use cached data
  // Otherwise (session restore, etc.) read from localStorage
  if (flow.profileSaved && flow.cachedResults && flow.cachedActualRoute) {
    return (
      <ResultsScreen
        results={flow.cachedResults}
        route={flow.cachedActualRoute}
        totalCorrect={flow.cachedScoredCorrect}
        atomResults={flow.cachedAtomResults}
        responses={flow.cachedResponsesForReview}
        onScoreCalculated={flow.setConsistentScore}
        onTopRouteCalculated={flow.setTopRouteInfo}
        hasSignedUp={true}
        precomputedRoutes={flow.cachedRoutesData ?? undefined}
      />
    );
  }

  // Read from localStorage (session restore)
  if (!flow.route) {
    console.error("Results screen rendered but route is not set");
    return <MaintenanceScreen />;
  }

  const counts = getResponseCounts();
  const actualRoute = getActualRouteFromStorage(flow.route);
  const scoredResponses = reconstructFullResponses({
    excludeOvertime: true,
  });
  const calculatedResults = calculateDiagnosticResults(
    scoredResponses,
    actualRoute
  );
  const allResponses = reconstructFullResponses();
  const atomResults = computeAtomMastery(allResponses);

  return (
    <ResultsScreen
      results={calculatedResults}
      route={actualRoute}
      totalCorrect={counts.scoredCorrect}
      atomResults={atomResults}
      responses={getResponsesForReview()}
      onScoreCalculated={flow.setConsistentScore}
      onTopRouteCalculated={flow.setTopRouteInfo}
      hasSignedUp={flow.profileSaved}
      precomputedRoutes={flow.routesData ?? undefined}
    />
  );
}
