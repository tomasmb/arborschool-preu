"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredResponses,
  reconstructFullResponses,
  getActualRouteFromStorage,
  getResponseCounts,
} from "@/lib/diagnostic/storage";
import { calculateDiagnosticResults } from "@/lib/diagnostic/resultsCalculator";
import { sortRoutesByImpact } from "./hooks/useLearningRoutes";
import type { LearningRouteData } from "./hooks/useLearningRoutes";
import { useDiagnosticFlow } from "./hooks/useDiagnosticFlow";
import {
  MiniFormScreen,
  TransitionScreen,
  PartialResultsScreen,
  ProfilingScreen,
  MaintenanceScreen,
  ConfirmSkipScreen,
  ThankYouScreen,
  StudentResultsHandoffScreen,
} from "./components";
import { QuestionScreenWrapper } from "./components/QuestionScreenWrapper";
import { ResultsScreenWrapper } from "./components/ResultsScreenWrapper";
import {
  GoalAnchorScreen,
  PlanPreviewScreen,
} from "@/app/components/onboarding";

const NEW_ONBOARDING = process.env.NEXT_PUBLIC_NEW_ONBOARDING === "true";

type ConfidenceLevel = "low" | "medium" | "high";

type StudentResultsSource = {
  scoreMin: number;
  scoreMax: number;
  totalCorrect: number;
  routes: LearningRouteData[];
};

interface PlanPreviewCtaProps {
  onShowPlan: () => void;
}

function SpinnerScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
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

function getStudentResultsSource(flow: ReturnType<typeof useDiagnosticFlow>) {
  if (!flow.profileSaved || !flow.cachedResults) {
    return null;
  }

  return {
    scoreMin: flow.cachedResults.paesMin,
    scoreMax: flow.cachedResults.paesMax,
    totalCorrect: flow.cachedScoredCorrect,
    routes: flow.cachedRoutesData?.routes ?? [],
  } satisfies StudentResultsSource;
}

function confidenceFromSource(source: StudentResultsSource | null) {
  if (!source) {
    return {
      level: "medium" as ConfidenceLevel,
      explanation:
        "Tu rango es útil para planificar, pero puede ajustarse con nuevos sprints.",
    };
  }

  const bandWidth = source.scoreMax - source.scoreMin;
  if (bandWidth <= 55) {
    return {
      level: "high" as ConfidenceLevel,
      explanation:
        "Tu rango es estrecho y la señal de respuestas fue consistente.",
    };
  }

  if (bandWidth <= 95) {
    return {
      level: "medium" as ConfidenceLevel,
      explanation:
        "Tu rango es útil para planificar, pero puede ajustarse con nuevos sprints.",
    };
  }

  return {
    level: "low" as ConfidenceLevel,
    explanation:
      "Tu rango es amplio. Con más evidencia de estudio se vuelve más preciso.",
  };
}

function expectedBand(pointsGain?: number) {
  if (!pointsGain || pointsGain <= 0) {
    return "+2 a +5 pts";
  }

  return `+${Math.max(1, Math.round(pointsGain * 0.6))} a +${Math.round(pointsGain)} pts`;
}

function StudentPartialResults(props: {
  scoreMin: number;
  scoreMax: number;
  totalCorrect: number;
  confidenceLevel: ConfidenceLevel;
  confidenceExplanation: string;
  potentialImprovement: number;
  studyHours: number;
  onStartSprint: () => void;
  onAdjustGoal: () => void;
}) {
  const estimatedMinutes =
    Math.max(10, Math.round(props.studyHours * 60)) || 25;

  return (
    <StudentResultsHandoffScreen
      scoreMin={props.scoreMin}
      scoreMax={props.scoreMax}
      totalCorrect={props.totalCorrect}
      confidenceLevel={props.confidenceLevel}
      confidenceExplanation={props.confidenceExplanation}
      targetGapLabel={
        props.potentialImprovement > 0
          ? `Tu siguiente foco puede mover hasta +${Math.round(props.potentialImprovement)} pts.`
          : "Tu siguiente sprint consolidará señal de dominio."
      }
      firstAction={{
        estimatedMinutes,
        expectedPointsBand: expectedBand(props.potentialImprovement),
        whyFirst:
          props.potentialImprovement > 0
            ? "Se prioriza la ruta con mejor relación impacto/tiempo."
            : "Se recomienda un sprint inicial para acumular evidencia.",
      }}
      onStartSprint={props.onStartSprint}
      onAdjustGoal={props.onAdjustGoal}
    />
  );
}

function StudentResultsScreen(props: {
  source: StudentResultsSource;
  confidenceLevel: ConfidenceLevel;
  confidenceExplanation: string;
  onStartSprint: () => void;
  onAdjustGoal: () => void;
}) {
  const topRoute = props.source.routes.length
    ? sortRoutesByImpact(props.source.routes)[0]
    : null;

  return (
    <StudentResultsHandoffScreen
      scoreMin={props.source.scoreMin}
      scoreMax={props.source.scoreMax}
      totalCorrect={props.source.totalCorrect}
      confidenceLevel={props.confidenceLevel}
      confidenceExplanation={props.confidenceExplanation}
      targetGapLabel={
        topRoute
          ? `Tu mayor ROI ahora está en ${topRoute.axis}.`
          : "Tu siguiente sprint consolidará la señal para priorizar mejor."
      }
      firstAction={{
        estimatedMinutes: topRoute
          ? Math.max(10, Math.round(topRoute.studyHours * 60))
          : 25,
        expectedPointsBand: expectedBand(topRoute?.pointsGain),
        whyFirst: topRoute
          ? `Se recomienda partir por ${topRoute.axis} porque tiene mejor impacto por minuto.`
          : "Se recomienda un sprint inicial para generar evidencia de dominio.",
      }}
      onStartSprint={props.onStartSprint}
      onAdjustGoal={props.onAdjustGoal}
    />
  );
}

function renderPartialResults(
  flow: ReturnType<typeof useDiagnosticFlow>,
  confidenceLevel: ConfidenceLevel,
  confidenceExplanation: string,
  onStartSprint: () => void,
  onAdjustGoal: () => void
) {
  if (!flow.route) {
    return <MaintenanceScreen />;
  }

  const counts = getResponseCounts();
  const actualRoute = getActualRouteFromStorage(flow.route);
  const scoredResponses = reconstructFullResponses({ excludeOvertime: true });
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

  if (flow.isStudentPortalUser) {
    return (
      <StudentPartialResults
        scoreMin={calculatedResults.paesMin}
        scoreMax={calculatedResults.paesMax}
        totalCorrect={counts.scoredCorrect}
        confidenceLevel={confidenceLevel}
        confidenceExplanation={confidenceExplanation}
        potentialImprovement={potentialImprovement}
        studyHours={studyHours}
        onStartSprint={onStartSprint}
        onAdjustGoal={onAdjustGoal}
      />
    );
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

function renderResults(
  flow: ReturnType<typeof useDiagnosticFlow>,
  source: StudentResultsSource | null,
  confidenceLevel: ConfidenceLevel,
  confidenceExplanation: string,
  onStartSprint: () => void,
  onAdjustGoal: () => void
) {
  if (flow.isStudentPortalUser && source) {
    return (
      <StudentResultsScreen
        source={source}
        confidenceLevel={confidenceLevel}
        confidenceExplanation={confidenceExplanation}
        onStartSprint={onStartSprint}
        onAdjustGoal={onAdjustGoal}
      />
    );
  }

  return (
    <>
      <ResultsScreenWrapper flow={flow} />
      {NEW_ONBOARDING && flow.profileSaved && !flow.isStudentPortalUser && (
        <PlanPreviewCta onShowPlan={flow.handleShowPlanPreview} />
      )}
    </>
  );
}

export default function DiagnosticoPage() {
  const flow = useDiagnosticFlow();
  const router = useRouter();
  const [goalAnchorDone, setGoalAnchorDone] = useState(false);

  const studentResultsSource = getStudentResultsSource(flow);
  const confidence = confidenceFromSource(studentResultsSource);
  const goToSprint = () => router.push("/portal/study");
  const goToGoals = () => router.push("/portal/goals");

  if (flow.isInitializingStudentSession) {
    return <SpinnerScreen />;
  }
  if (NEW_ONBOARDING && !goalAnchorDone) {
    return <GoalAnchorScreen onContinue={() => setGoalAnchorDone(true)} />;
  }
  if (flow.screen === "plan-preview") {
    return (
      <PlanPreviewScreen
        diagnosticScore={flow.consistentScore ?? 0}
        routesData={flow.cachedRoutesData ?? flow.routesData}
      />
    );
  }
  if (flow.screen === "mini-form") {
    return flow.isStudentPortalUser ? (
      <SpinnerScreen />
    ) : (
      <MiniFormScreen onSubmit={flow.handleMiniFormSubmit} />
    );
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
    return renderPartialResults(
      flow,
      confidence.level,
      confidence.explanation,
      goToSprint,
      goToGoals
    );
  }
  if (flow.screen === "results") {
    return renderResults(
      flow,
      studentResultsSource,
      confidence.level,
      confidence.explanation,
      goToSprint,
      goToGoals
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

  return <SpinnerScreen />;
}
