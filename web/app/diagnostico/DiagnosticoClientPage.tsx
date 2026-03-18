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

function StudentM1GoalScreen(props: {
  scoreMin: number;
  scoreMax: number;
  totalCorrect: number;
  onConfirmGoal: (m1Target: number) => void;
  onSkip: () => void;
}) {
  return (
    <StudentResultsHandoffScreen
      scoreMin={props.scoreMin}
      scoreMax={props.scoreMax}
      totalCorrect={props.totalCorrect}
      onConfirmGoal={props.onConfirmGoal}
      onSkip={props.onSkip}
    />
  );
}

function renderPartialResults(
  flow: ReturnType<typeof useDiagnosticFlow>,
  onConfirmGoal: (m1Target: number) => void,
  onSkipGoal: () => void
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

  if (flow.isStudentPortalUser) {
    return (
      <StudentM1GoalScreen
        scoreMin={calculatedResults.paesMin}
        scoreMax={calculatedResults.paesMax}
        totalCorrect={counts.scoredCorrect}
        onConfirmGoal={onConfirmGoal}
        onSkip={onSkipGoal}
      />
    );
  }

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

function renderResults(
  flow: ReturnType<typeof useDiagnosticFlow>,
  source: StudentResultsSource | null,
  onConfirmGoal: (m1Target: number) => void,
  onSkipGoal: () => void
) {
  if (flow.isStudentPortalUser && source) {
    return (
      <StudentM1GoalScreen
        scoreMin={source.scoreMin}
        scoreMax={source.scoreMax}
        totalCorrect={source.totalCorrect}
        onConfirmGoal={onConfirmGoal}
        onSkip={onSkipGoal}
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
  onConfirmGoal: (m1Target: number) => void;
  onSkipGoal: () => void;
}) {
  switch (params.flow.screen) {
    case "question":
      return <QuestionScreenWrapper flow={params.flow} />;
    case "transition":
      return renderTransitionScreen(params.flow);
    case "partial-results":
      return renderPartialResults(
        params.flow,
        params.onConfirmGoal,
        params.onSkipGoal
      );
    case "results":
      return renderResults(
        params.flow,
        params.studentResultsSource,
        params.onConfirmGoal,
        params.onSkipGoal
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
  const goToPortal = () => router.push("/portal");

  if (flow.isInitializingStudentSession) {
    return <SpinnerScreen />;
  }

  return renderFlowScreen({
    flow,
    studentResultsSource,
    onConfirmGoal: () => goToPortal(),
    onSkipGoal: goToPortal,
  });
}
