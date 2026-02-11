"use client";

import {
  isLocalAttempt,
  getStoredResponses,
  getResponsesForReview,
  reconstructFullResponses,
  getActualRouteFromStorage,
  getResponseCounts,
} from "@/lib/diagnostic/storage";
import {
  calculateDiagnosticResults,
  computeAtomMastery,
} from "@/lib/diagnostic/resultsCalculator";
import { sortRoutesByImpact } from "./hooks/useLearningRoutes";
import { useDiagnosticFlow } from "./hooks/useDiagnosticFlow";
import {
  WelcomeScreen,
  MiniFormScreen,
  TransitionScreen,
  PartialResultsScreen,
  ProfilingScreen,
  ResultsScreen,
  MaintenanceScreen,
} from "./components";
import { QuestionScreenWrapper } from "./components/QuestionScreenWrapper";
import { ResultsScreenWrapper } from "./components/ResultsScreenWrapper";

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DiagnosticoPage() {
  const flow = useDiagnosticFlow();

  // --------------------------------------------------------------------------
  // SCREEN ROUTING
  // --------------------------------------------------------------------------

  if (flow.screen === "welcome") {
    return <WelcomeScreen onStart={() => flow.setScreen("mini-form")} />;
  }

  if (flow.screen === "mini-form") {
    return <MiniFormScreen onSubmit={flow.handleMiniFormSubmit} />;
  }

  if (flow.screen === "question") {
    return <QuestionScreenWrapper flow={flow} />;
  }

  if (flow.screen === "transition" && flow.route) {
    const storedR1 = getStoredResponses().filter((r) => r.stage === 1);
    const r1Correct = storedR1.filter((r) => r.isCorrect).length;
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-off-white">
        <TransitionScreen
          r1Correct={r1Correct}
          route={flow.route}
          onContinue={flow.continueToStage2}
        />
      </div>
    );
  }

  if (flow.screen === "partial-results") {
    if (!flow.route) {
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

    let potentialImprovement = 0;
    let studyHours = 0;
    if (flow.routesData?.routes && flow.routesData.routes.length > 0) {
      const sortedRoutes = sortRoutesByImpact(flow.routesData.routes);
      potentialImprovement = sortedRoutes[0].pointsGain;
      studyHours = sortedRoutes[0].studyHours;
    }

    return (
      <PartialResultsScreen
        paesMin={calculatedResults.paesMin}
        paesMax={calculatedResults.paesMax}
        totalCorrect={counts.scoredCorrect}
        potentialImprovement={potentialImprovement}
        studyHours={studyHours}
        routesLoading={flow.routesLoading}
        onContinue={() => flow.setScreen("profiling")}
        onSkip={flow.handleProfileSkip}
      />
    );
  }

  if (flow.screen === "results") {
    return <ResultsScreenWrapper flow={flow} />;
  }

  if (flow.screen === "profiling") {
    return (
      <ProfilingScreen
        score={flow.consistentScore ?? undefined}
        onSubmit={flow.handleProfileSubmit}
        onSkip={flow.handleProfileSkip}
      />
    );
  }

  if (flow.screen === "maintenance") {
    return <MaintenanceScreen />;
  }

  // Fallback loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
