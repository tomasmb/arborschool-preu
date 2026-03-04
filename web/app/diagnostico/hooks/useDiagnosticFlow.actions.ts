"use client";

import { useCallback, type MutableRefObject } from "react";
import {
  MST_QUESTIONS,
  buildQuestionId,
  getRoute,
  getStage2Questions,
  QUESTIONS_PER_STAGE,
  type MSTQuestion,
  type Route,
} from "@/lib/diagnostic/config";
import { computeAtomMastery } from "@/lib/diagnostic/resultsCalculator";
import {
  clearAllDiagnosticData,
  generateLocalAttemptId,
  getResponseCounts,
  getResponsesForReview,
  getStoredResponses,
  isLocalAttempt,
  reconstructFullResponses,
  saveAttemptId,
} from "@/lib/diagnostic/storage";
import {
  markDiagnosticStart,
  trackConfirmSkipBackToProfiling,
  trackConfirmSkipExit,
  trackConfirmSkipViewed,
  trackDiagnosticCompleted,
  trackProfilingCompleted,
  trackStage1Completed,
} from "@/lib/analytics";
import { getPerformanceTier } from "@/lib/config/tiers";
import type { QuestionAtom } from "@/lib/diagnostic/qtiParser";
import type { DiagnosticResults } from "@/lib/diagnostic/resultsCalculator";
import type { ProfilingData } from "../components/ProfilingScreen";
import type { TopRouteInfo } from "../components/ResultsScreen";
import type { LearningRoutesResponse } from "./useLearningRoutes";
import {
  buildAndSaveProfile,
  completeTestAttempt,
  computeScoredResults,
  fetchLearningRoutesApi,
  saveQuestionResponse,
  startTestAttempt,
} from "../utils/diagnosticApi";
import type { Screen } from "./useDiagnosticFlow.types";

function resetQuestionState(params: {
  setSelectedAnswer: (value: string | null) => void;
  setIsDontKnow: (value: boolean) => void;
  questionStartTime: MutableRefObject<number>;
}) {
  params.setSelectedAnswer(null);
  params.setIsDontKnow(false);
  params.questionStartTime.current = Date.now();
}

export function getCurrentQuestion(params: {
  stage: 1 | 2;
  questionIndex: number;
  route: Route | null;
}): MSTQuestion {
  if (params.stage === 1) {
    return MST_QUESTIONS.R1[params.questionIndex];
  }

  if (!params.route) {
    throw new Error("getCurrentQuestion: route is not set for stage 2");
  }

  return getStage2Questions(params.route)[params.questionIndex];
}

export function useDiagnosticStartActions(params: {
  setStage: (value: 1 | 2) => void;
  setQuestionIndex: (value: number) => void;
  setSelectedAnswer: (value: string | null) => void;
  setIsDontKnow: (value: boolean) => void;
  setRoute: (value: Route | null) => void;
  setResults: (
    value: ReturnType<typeof computeScoredResults>["calc"] | null
  ) => void;
  setTimeRemaining: (value: number) => void;
  setTimeExpiredAt: (value: number | null) => void;
  setShowTimeUpModal: (value: boolean) => void;
  setProfileSaved: (value: boolean) => void;
  setAttemptId: (value: string | null) => void;
  setTimerStartedAt: (value: number | null) => void;
  setScreen: (value: Screen) => void;
  questionStartTime: MutableRefObject<number>;
}) {
  const startTest = useCallback(async () => {
    clearAllDiagnosticData();
    params.setStage(1);
    params.setQuestionIndex(0);
    params.setSelectedAnswer(null);
    params.setIsDontKnow(false);
    params.setRoute(null);
    params.setResults(null);
    params.setTimeRemaining(30 * 60);
    params.setTimeExpiredAt(null);
    params.setShowTimeUpModal(false);
    params.setProfileSaved(false);

    try {
      const data = await startTestAttempt();
      if (!data.success || !data.attemptId) {
        throw new Error("No attemptId");
      }
      params.setAttemptId(data.attemptId);
      saveAttemptId(data.attemptId);
    } catch (error) {
      console.error("Failed to start test:", error);
      const localId = generateLocalAttemptId();
      params.setAttemptId(localId);
      saveAttemptId(localId);
    }

    const now = Date.now();
    markDiagnosticStart();
    params.setTimerStartedAt(now);
    window.scrollTo(0, 0);
    params.setScreen("question");
    params.questionStartTime.current = now;
  }, [params]);

  return {
    startTest,
  };
}

export function useDiagnosticQuestionActions(params: {
  stage: 1 | 2;
  questionIndex: number;
  route: Route | null;
  selectedAnswer: string | null;
  isDontKnow: boolean;
  timeExpiredAt: number | null;
  attemptId: string | null;
  isStudentPortalUser: boolean;
  questionStartTime: MutableRefObject<number>;
  setQuestionIndex: (value: number) => void;
  setStage: (value: 1 | 2) => void;
  setRoute: (value: Route | null) => void;
  setScreen: (value: Screen) => void;
  setSelectedAnswer: (value: string | null) => void;
  setIsDontKnow: (value: boolean) => void;
  onDiagnosticComplete: () => Promise<void>;
}) {
  const continueToStage2 = useCallback(() => {
    params.setStage(2);
    params.setQuestionIndex(0);
    resetQuestionState(params);
    params.setScreen("question");
  }, [params]);

  const handleNext = useCallback(
    async (
      correctAnswer: string | null,
      atoms: QuestionAtom[],
      alternateQuestionId: string | null
    ) => {
      const question = getCurrentQuestion(params);
      const responseTime = Math.floor(
        (Date.now() - params.questionStartTime.current) / 1000
      );
      const isCorrect =
        !params.isDontKnow &&
        params.selectedAnswer !== null &&
        correctAnswer !== null &&
        params.selectedAnswer === correctAnswer;

      const questionId = buildQuestionId(
        question.exam,
        question.questionNumber
      );
      await saveQuestionResponse({
        questionId,
        selectedAnswer: params.selectedAnswer || "skip",
        isCorrect,
        responseTimeSeconds: responseTime,
        stage: params.stage,
        questionIndex: params.questionIndex,
        route: params.stage === 2 ? params.route : null,
        atoms: atoms.map((a) => ({ atomId: a.atomId, relevance: a.relevance })),
        answeredAfterTimeUp: params.timeExpiredAt !== null,
        alternateQuestionId: alternateQuestionId ?? undefined,
        attemptId: params.attemptId,
      });

      if (
        params.stage === 1 &&
        params.questionIndex === QUESTIONS_PER_STAGE - 1
      ) {
        const storedR1 = getStoredResponses().filter((r) => r.stage === 1);
        const correctCount = storedR1.filter((r) => r.isCorrect).length;
        const assignedRoute = getRoute(correctCount);
        trackStage1Completed(correctCount, assignedRoute);
        params.setRoute(assignedRoute);
        params.setScreen("transition");
        return;
      }

      if (
        params.stage === 2 &&
        params.questionIndex === QUESTIONS_PER_STAGE - 1
      ) {
        await params.onDiagnosticComplete();
        return;
      }

      params.setQuestionIndex(params.questionIndex + 1);
      resetQuestionState(params);
    },
    [params]
  );

  return {
    continueToStage2,
    handleNext,
  };
}

function useRouteFetcher(params: {
  setRoutesLoading: (value: boolean) => void;
  setRoutesData: (value: LearningRoutesResponse | null) => void;
}) {
  return useCallback(
    async (
      atomResults: { atomId: string; mastered: boolean }[],
      diagnosticScore: number
    ) => {
      params.setRoutesLoading(true);
      try {
        const data = await fetchLearningRoutesApi(atomResults, diagnosticScore);
        if (data) {
          params.setRoutesData(data);
        }
      } catch (error) {
        console.error("Failed to fetch learning routes:", error);
      } finally {
        params.setRoutesLoading(false);
      }
    },
    [params]
  );
}

function stopTimer(timerRef: MutableRefObject<NodeJS.Timeout | null>) {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

function cacheSavedProfileResult(
  params: {
    routesData: LearningRoutesResponse | null;
    setCachedResponsesForReview: (
      value: ReturnType<typeof getResponsesForReview>
    ) => void;
    setCachedResults: (
      value: ReturnType<typeof computeScoredResults>["calc"] | null
    ) => void;
    setCachedAtomResults: (
      value: { atomId: string; mastered: boolean }[]
    ) => void;
    setCachedScoredCorrect: (value: number) => void;
    setCachedActualRoute: (value: Route | null) => void;
    setCachedRoutesData: (value: LearningRoutesResponse | null) => void;
    setProfileSaved: (value: boolean) => void;
    setScreen: (value: Screen) => void;
  },
  result: Awaited<ReturnType<typeof buildAndSaveProfile>>
) {
  params.setCachedResponsesForReview(getResponsesForReview());
  params.setCachedResults(result.calculatedResults);
  params.setCachedAtomResults(result.atomResults);
  params.setCachedScoredCorrect(result.scoredCorrect);
  params.setCachedActualRoute(result.actualRoute);
  params.setCachedRoutesData(params.routesData);
  clearAllDiagnosticData();
  params.setProfileSaved(true);
  params.setScreen("results");
}

async function completeRemoteAttempt(params: {
  attemptId: string | null;
  correctAnswers: number;
  route: Route;
}) {
  if (isLocalAttempt(params.attemptId)) {
    return;
  }

  const stage1Correct = getStoredResponses().filter(
    (r) => r.stage === 1 && !r.answeredAfterTimeUp && r.isCorrect
  ).length;

  await completeTestAttempt({
    attemptId: params.attemptId,
    totalQuestions: 16,
    correctAnswers: params.correctAnswers,
    stage1Score: stage1Correct,
    stage2Difficulty: params.route,
  });
}

async function presentCompletionResults(params: {
  isStudentPortalUser: boolean;
  saveProfileAndShowResults: () => Promise<void>;
  showResultsScreen: () => void;
}) {
  if (!params.isStudentPortalUser) {
    params.showResultsScreen();
    return;
  }

  try {
    await params.saveProfileAndShowResults();
  } catch (error) {
    console.error("Failed to save student diagnostic profile:", error);
    params.showResultsScreen();
  }
}

export function useDiagnosticResultsActions(params: {
  userId: string | null;
  attemptId: string | null;
  route: Route | null;
  topRouteInfo: TopRouteInfo | null;
  routesData: LearningRoutesResponse | null;
  isStudentPortalUser: boolean;
  timerRef: MutableRefObject<NodeJS.Timeout | null>;
  setScreen: (value: Screen) => void;
  setResults: (value: DiagnosticResults | null) => void;
  setConsistentScore: (value: number | null) => void;
  setProfileSaved: (value: boolean) => void;
  setCachedResponsesForReview: (
    value: ReturnType<typeof getResponsesForReview>
  ) => void;
  setCachedResults: (
    value: ReturnType<typeof computeScoredResults>["calc"] | null
  ) => void;
  setCachedAtomResults: (
    value: { atomId: string; mastered: boolean }[]
  ) => void;
  setCachedScoredCorrect: (value: number) => void;
  setCachedActualRoute: (value: Route | null) => void;
  setCachedRoutesData: (value: LearningRoutesResponse | null) => void;
  setRoutesLoading: (value: boolean) => void;
  setRoutesData: (value: LearningRoutesResponse | null) => void;
}) {
  const fetchRoutes = useRouteFetcher({
    setRoutesLoading: params.setRoutesLoading,
    setRoutesData: params.setRoutesData,
  });

  const showResultsScreen = useCallback(() => {
    if (!params.route) {
      params.setScreen("maintenance");
      return;
    }

    const { calc, midScore } = computeScoredResults(params.route);
    params.setResults(calc);
    params.setConsistentScore(midScore);
    void fetchRoutes(computeAtomMastery(reconstructFullResponses()), midScore);
    stopTimer(params.timerRef);
    params.setScreen("partial-results");
  }, [fetchRoutes, params]);

  const saveProfileAndShowResults = useCallback(
    async (profilingData?: ProfilingData) => {
      if (!params.route) {
        throw new Error("Cannot save profile: route is not set");
      }

      const result = await buildAndSaveProfile({
        userId: params.userId,
        attemptId: params.attemptId,
        route: params.route,
        topRouteInfo: params.topRouteInfo,
        profilingData,
      });
      cacheSavedProfileResult(params, result);
    },
    [params]
  );

  const calculateAndShowResults = useCallback(async () => {
    const counts = getResponseCounts();
    if (!params.route) {
      params.setScreen("maintenance");
      return;
    }

    const tier = getPerformanceTier(counts.scoredCorrect);
    trackDiagnosticCompleted(counts.scoredCorrect, tier, params.route);

    await presentCompletionResults({
      isStudentPortalUser: params.isStudentPortalUser,
      saveProfileAndShowResults,
      showResultsScreen,
    });

    try {
      await completeRemoteAttempt({
        attemptId: params.attemptId,
        correctAnswers: counts.scoredCorrect,
        route: params.route,
      });
    } catch (error) {
      console.error("Failed to complete test:", error);
    }
  }, [params, saveProfileAndShowResults, showResultsScreen]);

  return {
    showResultsScreen,
    saveProfileAndShowResults,
    calculateAndShowResults,
  };
}

export function useDiagnosticProfileExitActions(params: {
  route: Route | null;
  userId: string | null;
  attemptId: string | null;
  topRouteInfo: TopRouteInfo | null;
  profileSaved: boolean;
  setScreen: (value: Screen) => void;
  onSaveProfile: (profilingData?: ProfilingData) => Promise<void>;
}) {
  const handleProfileSubmit = useCallback(
    async (profilingData: ProfilingData) => {
      trackProfilingCompleted({
        paesGoal: !!profilingData.paesGoal,
        paesDate: !!profilingData.paesDate,
        inPreu: profilingData.inPreu !== undefined,
      });
      await params.onSaveProfile(profilingData);
    },
    [params]
  );

  const handleSkipToConfirm = useCallback(() => {
    trackConfirmSkipViewed();
    params.setScreen("confirm-skip");
  }, [params]);

  const handleConfirmExit = useCallback(async () => {
    trackConfirmSkipExit();

    if (!params.profileSaved && params.route) {
      try {
        await buildAndSaveProfile({
          userId: params.userId,
          attemptId: params.attemptId,
          route: params.route,
          topRouteInfo: params.topRouteInfo,
        });
      } catch (error) {
        console.error("Failed to save profile on confirm exit:", error);
      }
    }

    clearAllDiagnosticData();
    params.setScreen("thank-you");
  }, [params]);

  const handleBackToProfiling = useCallback(() => {
    trackConfirmSkipBackToProfiling();
    params.setScreen("profiling");
  }, [params]);

  return {
    handleProfileSubmit,
    handleSkipToConfirm,
    handleConfirmExit,
    handleBackToProfiling,
  };
}
