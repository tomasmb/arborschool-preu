"use client";

import { useCallback, type MutableRefObject } from "react";
import { useSessionPersistence } from "../hooks/useSessionPersistence";
import { getCurrentQuestion } from "./useDiagnosticFlow.actions";
import {
  useDiagnosticProfileExitActions,
  useDiagnosticQuestionActions,
  useDiagnosticResultsActions,
  useDiagnosticStartActions,
} from "./useDiagnosticFlow.actions";
import {
  useDiagnosticIntroTracking,
  useDiagnosticScrollToTop,
  useDiagnosticStudentBootstrap,
} from "./useDiagnosticFlow.bootstrap";
import {
  useDiagnosticFlowCacheState,
  useDiagnosticFlowCoreState,
  useDiagnosticFlowTimerState,
} from "./useDiagnosticFlow.state";
import { useDiagnosticTimer, useRouteRef } from "./useDiagnosticFlow.timer";
import type { Screen } from "./useDiagnosticFlow.types";

export type { Screen };

type CoreState = ReturnType<typeof useDiagnosticFlowCoreState>;
type CacheState = ReturnType<typeof useDiagnosticFlowCacheState>;
type TimerState = ReturnType<typeof useDiagnosticFlowTimerState>;

function useLifecycleControllers(core: CoreState, timer: TimerState) {
  const startActions = useDiagnosticStartActions({
    setStage: core.setStage,
    setQuestionIndex: core.setQuestionIndex,
    setSelectedAnswer: core.setSelectedAnswer,
    setIsDontKnow: core.setIsDontKnow,
    setRoute: core.setRoute,
    setResults: core.setResults,
    setTimeRemaining: timer.setTimeRemaining,
    setTimeExpiredAt: timer.setTimeExpiredAt,
    setShowTimeUpModal: timer.setShowTimeUpModal,
    setProfileSaved: core.setProfileSaved,
    setAttemptId: timer.setAttemptId,
    setTimerStartedAt: timer.setTimerStartedAt,
    setScreen: core.setScreen,
    questionStartTime: timer.questionStartTime,
  });

  useDiagnosticStudentBootstrap({
    setIsStudentPortalUser: core.setIsStudentPortalUser,
    setUserId: core.setUserId,
    setStudentSessionChecked: core.setStudentSessionChecked,
    setIsInitializingStudentSession: core.setIsInitializingStudentSession,
    startTest: startActions.startTest,
  });

  return { startActions };
}

function useExecutionControllers(
  core: CoreState,
  cache: CacheState,
  timer: TimerState,
  routeRef: MutableRefObject<CoreState["route"]>
) {
  const resultActions = useDiagnosticResultsActions({
    userId: core.userId,
    attemptId: timer.attemptId,
    route: core.route,
    topRouteInfo: core.topRouteInfo,
    routesData: cache.routesData,
    isStudentPortalUser: core.isStudentPortalUser,
    timerRef: timer.timerRef,
    setScreen: core.setScreen,
    setResults: core.setResults,
    setConsistentScore: core.setConsistentScore,
    setProfileSaved: core.setProfileSaved,
    setCachedResponsesForReview: cache.setCachedResponsesForReview,
    setCachedResults: cache.setCachedResults,
    setCachedAtomResults: cache.setCachedAtomResults,
    setCachedScoredCorrect: cache.setCachedScoredCorrect,
    setCachedActualRoute: cache.setCachedActualRoute,
    setCachedRoutesData: cache.setCachedRoutesData,
    setRoutesLoading: cache.setRoutesLoading,
    setRoutesData: cache.setRoutesData,
  });

  const questionActions = useDiagnosticQuestionActions({
    stage: core.stage,
    questionIndex: core.questionIndex,
    route: core.route,
    selectedAnswer: core.selectedAnswer,
    isDontKnow: core.isDontKnow,
    timeExpiredAt: timer.timeExpiredAt,
    attemptId: timer.attemptId,
    isStudentPortalUser: core.isStudentPortalUser,
    questionStartTime: timer.questionStartTime,
    setQuestionIndex: core.setQuestionIndex,
    setStage: core.setStage,
    setRoute: core.setRoute,
    setScreen: core.setScreen,
    setSelectedAnswer: core.setSelectedAnswer,
    setIsDontKnow: core.setIsDontKnow,
    onDiagnosticComplete: resultActions.calculateAndShowResults,
  });

  const profileExitActions = useDiagnosticProfileExitActions({
    route: core.route,
    userId: core.userId,
    attemptId: timer.attemptId,
    topRouteInfo: core.topRouteInfo,
    profileSaved: core.profileSaved,
    setScreen: core.setScreen,
    onSaveProfile: resultActions.saveProfileAndShowResults,
  });

  const timerActions = useDiagnosticTimer(
    {
      stage: core.stage,
      questionIndex: core.questionIndex,
      route: core.route,
      screen: core.screen,
      timeExpiredAt: timer.timeExpiredAt,
      timerRef: timer.timerRef,
      setTimeExpiredAt: timer.setTimeExpiredAt,
      setTimeRemaining: timer.setTimeRemaining,
      setShowTimeUpModal: timer.setShowTimeUpModal,
      setScreen: core.setScreen,
      setResults: core.setResults,
      setConsistentScore: core.setConsistentScore,
    },
    routeRef
  );

  return {
    resultActions,
    questionActions,
    profileExitActions,
    timerActions,
  };
}

function useUiHandlers(core: CoreState) {
  const handleSelectAnswer = useCallback(
    (answer: string) => {
      core.setSelectedAnswer(answer);
      core.setIsDontKnow(false);
    },
    [core]
  );

  const handleSelectDontKnow = useCallback(() => {
    core.setIsDontKnow(true);
    core.setSelectedAnswer(null);
  }, [core]);

  const handleFatalError = useCallback(() => {
    core.setScreen("maintenance");
  }, [core]);

  const handleShowPlanPreview = useCallback(() => {
    core.setScreen("plan-preview");
  }, [core]);

  return {
    handleSelectAnswer,
    handleSelectDontKnow,
    handleFatalError,
    handleShowPlanPreview,
  };
}

function buildFlowResult(params: {
  core: CoreState;
  cache: CacheState;
  timer: TimerState;
  startActions: ReturnType<typeof useLifecycleControllers>["startActions"];
  execution: ReturnType<typeof useExecutionControllers>;
  uiHandlers: ReturnType<typeof useUiHandlers>;
}) {
  return {
    screen: params.core.screen,
    setScreen: params.core.setScreen,
    isStudentPortalUser: params.core.isStudentPortalUser,
    isInitializingStudentSession: params.core.isInitializingStudentSession,
    stage: params.core.stage,
    questionIndex: params.core.questionIndex,
    route: params.core.route,
    selectedAnswer: params.core.selectedAnswer,
    isDontKnow: params.core.isDontKnow,
    results: params.core.results,
    consistentScore: params.core.consistentScore,
    setConsistentScore: params.core.setConsistentScore,
    topRouteInfo: params.core.topRouteInfo,
    setTopRouteInfo: params.core.setTopRouteInfo,
    profileSaved: params.core.profileSaved,
    cachedResults: params.cache.cachedResults,
    cachedAtomResults: params.cache.cachedAtomResults,
    cachedScoredCorrect: params.cache.cachedScoredCorrect,
    cachedActualRoute: params.cache.cachedActualRoute,
    cachedResponsesForReview: params.cache.cachedResponsesForReview,
    cachedRoutesData: params.cache.cachedRoutesData,
    routesData: params.cache.routesData,
    routesLoading: params.cache.routesLoading,
    attemptId: params.timer.attemptId,
    timeRemaining: params.timer.timeRemaining,
    timeExpiredAt: params.timer.timeExpiredAt,
    showTimeUpModal: params.timer.showTimeUpModal,
    getCurrentQuestion: () =>
      getCurrentQuestion({
        stage: params.core.stage,
        questionIndex: params.core.questionIndex,
        route: params.core.route,
      }),
    handleSelectAnswer: params.uiHandlers.handleSelectAnswer,
    handleSelectDontKnow: params.uiHandlers.handleSelectDontKnow,
    handleNext: params.execution.questionActions.handleNext,
    handleFatalError: params.uiHandlers.handleFatalError,
    handleTimeUp: params.execution.timerActions.handleTimeUp,
    handleContinueAfterTimeUp:
      params.execution.timerActions.handleContinueAfterTimeUp,
    handleViewResultsAfterTimeUp:
      params.execution.timerActions.handleViewResultsAfterTimeUp,
    continueToStage2: params.execution.questionActions.continueToStage2,
    handleProfileSubmit:
      params.execution.profileExitActions.handleProfileSubmit,
    handleSkipToConfirm:
      params.execution.profileExitActions.handleSkipToConfirm,
    handleConfirmExit: params.execution.profileExitActions.handleConfirmExit,
    handleBackToProfiling:
      params.execution.profileExitActions.handleBackToProfiling,
    handleShowPlanPreview: params.uiHandlers.handleShowPlanPreview,
  };
}

export function useDiagnosticFlow() {
  const core = useDiagnosticFlowCoreState();
  const cache = useDiagnosticFlowCacheState();
  const timer = useDiagnosticFlowTimerState();
  const routeRef = useRouteRef(core.route);

  useDiagnosticIntroTracking({
    screen: core.screen,
    studentSessionChecked: core.studentSessionChecked,
    isStudentPortalUser: core.isStudentPortalUser,
  });

  useSessionPersistence(
    {
      setScreen: core.setScreen,
      setStage: core.setStage,
      setQuestionIndex: core.setQuestionIndex,
      setRoute: core.setRoute,
      setTimerStartedAt: timer.setTimerStartedAt,
      setTimeExpiredAt: timer.setTimeExpiredAt,
      setTimeRemaining: timer.setTimeRemaining,
      setResults: core.setResults,
      setAttemptId: timer.setAttemptId,
    },
    {
      screen: core.screen,
      stage: core.stage,
      questionIndex: core.questionIndex,
      route: core.route,
      timerStartedAt: timer.timerStartedAt,
      timeExpiredAt: timer.timeExpiredAt,
      results: core.results,
    }
  );

  useDiagnosticScrollToTop({
    screen: core.screen,
    questionIndex: core.questionIndex,
    stage: core.stage,
  });

  const lifecycle = useLifecycleControllers(core, timer);
  const execution = useExecutionControllers(core, cache, timer, routeRef);
  const uiHandlers = useUiHandlers(core);

  return buildFlowResult({
    core,
    cache,
    timer,
    startActions: lifecycle.startActions,
    execution,
    uiHandlers,
  });
}
