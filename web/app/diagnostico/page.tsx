"use client";

import { useState } from "react";
import {
  getStoredResponses,
  reconstructFullResponses,
  getActualRouteFromStorage,
  getResponseCounts,
} from "@/lib/diagnostic/storage";
import { calculateDiagnosticResults } from "@/lib/diagnostic/resultsCalculator";
import { sortRoutesByImpact } from "./hooks/useLearningRoutes";
import { useDiagnosticFlow } from "./hooks/useDiagnosticFlow";
import {
  MiniFormScreen,
  TransitionScreen,
  PartialResultsScreen,
  ProfilingScreen,
  MaintenanceScreen,
  ConfirmSkipScreen,
  ThankYouScreen,
} from "./components";
import { QuestionScreenWrapper } from "./components/QuestionScreenWrapper";
import { ResultsScreenWrapper } from "./components/ResultsScreenWrapper";
import {
  GoalAnchorScreen,
  PlanPreviewScreen,
} from "@/app/components/onboarding";

// ============================================================================
// FEATURE FLAG
// Tomás: set NEXT_PUBLIC_NEW_ONBOARDING=true in .env.local to activate.
// Default is false — existing flow is 100% unchanged when flag is off.
// ============================================================================

const NEW_ONBOARDING = process.env.NEXT_PUBLIC_NEW_ONBOARDING === "true";

// ============================================================================
// PLAN PREVIEW FLOATING CTA
// Rendered as an overlay above the results screen when new onboarding is on.
// ============================================================================

interface PlanPreviewCtaProps {
  onShowPlan: () => void;
}

function PlanPreviewCta({ onShowPlan }: PlanPreviewCtaProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-xl">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-charcoal font-medium">
          Tu ruta de estudio está lista
        </p>
        <button
          onClick={onShowPlan}
          className="btn-cta px-6 py-3 text-sm shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
        >
          Ver mi plan
          <svg
            className="w-4 h-4 ml-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DiagnosticoPage() {
  const flow = useDiagnosticFlow();

  // Goal anchor gate — only relevant when feature flag is ON
  // Initialized to true so goal-anchor is shown first
  const [goalAnchorDone, setGoalAnchorDone] = useState(false);

  // --------------------------------------------------------------------------
  // NEW ONBOARDING — Phase 1: Goal Anchor (before mini-form)
  // --------------------------------------------------------------------------

  if (NEW_ONBOARDING && !goalAnchorDone) {
    return <GoalAnchorScreen onContinue={() => setGoalAnchorDone(true)} />;
  }

  // --------------------------------------------------------------------------
  // NEW ONBOARDING — Phase 2: Plan Preview (after results)
  // --------------------------------------------------------------------------

  if (flow.screen === "plan-preview") {
    const score = flow.consistentScore ?? 0;
    const routes = flow.cachedRoutesData ?? flow.routesData;
    return <PlanPreviewScreen diagnosticScore={score} routesData={routes} />;
  }

  // --------------------------------------------------------------------------
  // EXISTING FLOW (unchanged when NEW_ONBOARDING=false)
  // --------------------------------------------------------------------------

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
        onSkip={flow.handleSkipToConfirm}
      />
    );
  }

  if (flow.screen === "results") {
    return (
      <>
        <ResultsScreenWrapper flow={flow} />
        {/* Phase 2 CTA overlay — only shown when signed up + new onboarding on */}
        {NEW_ONBOARDING && flow.profileSaved && (
          <PlanPreviewCta onShowPlan={flow.handleShowPlanPreview} />
        )}
      </>
    );
  }

  if (flow.screen === "profiling") {
    return (
      <ProfilingScreen
        score={flow.consistentScore ?? undefined}
        onSubmit={flow.handleProfileSubmit}
        onSkip={flow.handleSkipToConfirm}
      />
    );
  }

  if (flow.screen === "confirm-skip") {
    return (
      <ConfirmSkipScreen
        onBackToProfiling={flow.handleBackToProfiling}
        onConfirmExit={flow.handleConfirmExit}
      />
    );
  }

  if (flow.screen === "thank-you") {
    return <ThankYouScreen score={flow.consistentScore} />;
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
