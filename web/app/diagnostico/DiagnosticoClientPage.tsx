"use client";

import { useRouter } from "next/navigation";
import {
  getStoredResponses,
  reconstructFullResponses,
  getActualRouteFromStorage,
  getResponseCounts,
} from "@/lib/diagnostic/storage";
import { calculateDiagnosticResults } from "@/lib/diagnostic/resultsCalculator";
import {
  sortRoutesByImpact,
  type LearningRouteData,
} from "./hooks/useLearningRoutes";
import { useDiagnosticFlow } from "./hooks/useDiagnosticFlow";
import {
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

type ConfidenceLevel = "low" | "medium" | "high";

type StudentResultsSource = {
  scoreMin: number;
  scoreMax: number;
  totalCorrect: number;
  routes: LearningRouteData[];
};

function SpinnerScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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

  return <ResultsScreenWrapper flow={flow} />;
}

function renderTransitionScreen(flow: ReturnType<typeof useDiagnosticFlow>) {
  if (!flow.route) {
    return <SpinnerScreen />;
  }

  const storedR1 = getStoredResponses().filter(
    (response) => response.stage === 1
  );
  const r1Correct = storedR1.filter((response) => response.isCorrect).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-off-white">
      <TransitionScreen
        r1Correct={r1Correct}
        onContinue={flow.continueToStage2}
      />
    </div>
  );
}

function renderFlowScreen(params: {
  flow: ReturnType<typeof useDiagnosticFlow>;
  studentResultsSource: StudentResultsSource | null;
  confidenceLevel: ConfidenceLevel;
  confidenceExplanation: string;
  goToSprint: () => void;
  goToGoals: () => void;
}) {
  switch (params.flow.screen) {
    case "question":
      return <QuestionScreenWrapper flow={params.flow} />;
    case "transition":
      return renderTransitionScreen(params.flow);
    case "partial-results":
      return renderPartialResults(
        params.flow,
        params.confidenceLevel,
        params.confidenceExplanation,
        params.goToSprint,
        params.goToGoals
      );
    case "results":
      return renderResults(
        params.flow,
        params.studentResultsSource,
        params.confidenceLevel,
        params.confidenceExplanation,
        params.goToSprint,
        params.goToGoals
      );
    case "profiling":
      return (
        <ProfilingScreen
          score={params.flow.consistentScore ?? undefined}
          onSubmit={params.flow.handleProfileSubmit}
          onSkip={params.flow.handleSkipToConfirm}
        />
      );
    case "confirm-skip":
      return (
        <ConfirmSkipScreen
          onBackToProfiling={params.flow.handleBackToProfiling}
          onConfirmExit={params.flow.handleConfirmExit}
        />
      );
    case "thank-you":
      return <ThankYouScreen score={params.flow.consistentScore} />;
    case "maintenance":
      return <MaintenanceScreen />;
    default:
      return <SpinnerScreen />;
  }
}

export default function DiagnosticoClientPage() {
  const flow = useDiagnosticFlow();
  const router = useRouter();

  const studentResultsSource = getStudentResultsSource(flow);
  const confidence = confidenceFromSource(studentResultsSource);
  const goToSprint = () => router.push("/portal/study");
  const goToGoals = () => router.push("/portal/goals");

  if (flow.isInitializingStudentSession) {
    return <SpinnerScreen />;
  }

  return renderFlowScreen({
    flow,
    studentResultsSource,
    confidenceLevel: confidence.level,
    confidenceExplanation: confidence.explanation,
    goToSprint,
    goToGoals,
  });
}
