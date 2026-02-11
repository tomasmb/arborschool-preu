"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MST_QUESTIONS,
  getRoute,
  getStage2Questions,
  buildQuestionId,
  QUESTIONS_PER_STAGE,
  type MSTQuestion,
  type Route,
} from "@/lib/diagnostic/config";
import {
  computeAtomMastery,
  type DiagnosticResponse,
  type DiagnosticResults,
} from "@/lib/diagnostic/resultsCalculator";
import {
  getStoredResponses,
  saveAttemptId,
  isLocalAttempt,
  generateLocalAttemptId,
  clearAllDiagnosticData,
  getResponsesForReview,
  reconstructFullResponses,
  getResponseCounts,
  type ResponseForReview,
} from "@/lib/diagnostic/storage";
import { useSessionPersistence } from "../hooks/useSessionPersistence";
import { type QuestionAtom } from "@/lib/diagnostic/qtiParser";
import { getPerformanceTier } from "@/lib/config/tiers";
import {
  trackDiagnosticIntroViewed,
  trackDiagnosticStarted,
  trackDiagnosticCompleted,
  trackMiniFormCompleted,
  trackProfilingCompleted,
  trackProfilingSkipped,
} from "@/lib/analytics";
import { type MiniFormData } from "../components/MiniFormScreen";
import { type ProfilingData } from "../components/ProfilingScreen";
import { type TopRouteInfo } from "../components/ResultsScreen";
import { type LearningRoutesResponse } from "./useLearningRoutes";
import {
  registerUser,
  startTestAttempt,
  completeTestAttempt,
  fetchLearningRoutesApi,
  saveQuestionResponse,
  buildAndSaveProfile,
  computeScoredResults,
} from "../utils/diagnosticApi";

export type Screen =
  | "welcome"
  | "mini-form"
  | "question"
  | "transition"
  | "partial-results"
  | "profiling"
  | "results"
  | "maintenance";

const TOTAL_TIME_SECONDS = 30 * 60; // 30 minutes

/** Core diagnostic flow hook — state, effects, and handlers for all screens. */
export function useDiagnosticFlow() {
  // --- State: navigation & test progress ---
  const [screen, setScreen] = useState<Screen>("welcome");
  const [stage, setStage] = useState<1 | 2>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isDontKnow, setIsDontKnow] = useState(false);

  // --- State: responses & results ---
  const [r1Responses, setR1Responses] = useState<DiagnosticResponse[]>([]);
  const [stage2Responses, setStage2Responses] = useState<DiagnosticResponse[]>(
    []
  );
  const [route, setRoute] = useState<Route | null>(null);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [consistentScore, setConsistentScore] = useState<number | null>(null);
  const [topRouteInfo, setTopRouteInfo] = useState<TopRouteInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // --- State: cached data (after profile save clears localStorage) ---
  const [cachedResponsesForReview, setCachedResponsesForReview] = useState<
    ResponseForReview[]
  >([]);
  const [cachedResults, setCachedResults] = useState<DiagnosticResults | null>(
    null
  );
  const [cachedAtomResults, setCachedAtomResults] = useState<
    { atomId: string; mastered: boolean }[]
  >([]);
  const [cachedScoredCorrect, setCachedScoredCorrect] = useState<number>(0);
  const [cachedActualRoute, setCachedActualRoute] = useState<Route | null>(
    null
  );

  // --- State: learning routes ---
  const [routesData, setRoutesData] = useState<LearningRoutesResponse | null>(
    null
  );
  const [routesLoading, setRoutesLoading] = useState(false);
  const [cachedRoutesData, setCachedRoutesData] =
    useState<LearningRoutesResponse | null>(null);

  // --- State: timer & tracking ---
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_SECONDS);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timeExpiredAt, setTimeExpiredAt] = useState<number | null>(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  // --- Refs ---
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());
  const routeRef = useRef(route);

  // --- Effects ---
  useEffect(() => {
    routeRef.current = route;
  }, [route]);
  useEffect(() => {
    trackDiagnosticIntroViewed();
  }, []);
  useSessionPersistence(
    {
      setScreen,
      setStage,
      setQuestionIndex,
      setRoute,
      setTimerStartedAt,
      setTimeExpiredAt,
      setTimeRemaining,
      setResults,
      setAttemptId,
    },
    {
      screen,
      stage,
      questionIndex,
      route,
      timerStartedAt,
      timeExpiredAt,
      results,
    }
  );
  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [screen, questionIndex, stage]);

  // --- Timer ---
  const handleTimeUp = useCallback(() => {
    setTimeExpiredAt(Date.now());
    setTimeRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowTimeUpModal(true);
  }, []);

  const handleContinueAfterTimeUp = useCallback(() => {
    setShowTimeUpModal(false);
  }, []);

  const handleViewResultsAfterTimeUp = useCallback(() => {
    setShowTimeUpModal(false);
    const currentRoute = routeRef.current;
    if (!currentRoute) {
      setScreen("maintenance");
      return;
    }
    const { calc, midScore } = computeScoredResults(currentRoute);
    setResults(calc);
    setConsistentScore(midScore);
    setScreen("partial-results");
  }, []);

  useEffect(() => {
    if (timeExpiredAt !== null) return;
    if (screen === "question" && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setTimeout(() => handleTimeUp(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current && screen !== "question") {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [screen, handleTimeUp, timeExpiredAt]);

  // --- Question handlers ---
  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setIsDontKnow(false);
    questionStartTime.current = Date.now();
  };

  const getCurrentQuestion = (): MSTQuestion => {
    if (stage === 1) return MST_QUESTIONS.R1[questionIndex];
    if (!route)
      throw new Error("getCurrentQuestion: route is not set for stage 2");
    return getStage2Questions(route)[questionIndex];
  };

  const handleSelectAnswer = useCallback((answer: string) => {
    setSelectedAnswer(answer);
    setIsDontKnow(false);
  }, []);

  const handleSelectDontKnow = useCallback(() => {
    setIsDontKnow(true);
    setSelectedAnswer(null);
  }, []);

  const handleFatalError = useCallback(() => setScreen("maintenance"), []);

  // --- Flow handlers ---
  const fetchRoutes = async (
    atomResults: { atomId: string; mastered: boolean }[],
    diagnosticScore: number
  ) => {
    setRoutesLoading(true);
    try {
      const data = await fetchLearningRoutesApi(atomResults, diagnosticScore);
      if (data) setRoutesData(data);
    } catch (error) {
      console.error("Failed to fetch learning routes:", error);
    } finally {
      setRoutesLoading(false);
    }
  };

  const showResultsScreen = () => {
    if (!route) {
      setScreen("maintenance");
      return;
    }
    const { calc, midScore } = computeScoredResults(route);
    setResults(calc);
    setConsistentScore(midScore);
    fetchRoutes(computeAtomMastery(reconstructFullResponses()), midScore);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setScreen("partial-results");
  };

  const handleMiniFormSubmit = async (data: MiniFormData) => {
    const result = await registerUser(data.email, data.userType, data.curso);
    if (!result.success || !result.userId) {
      throw new Error(result.error || "Error al registrar");
    }
    trackMiniFormCompleted(data.email, data.userType, data.curso);
    setUserId(result.userId);
    await startTest(result.userId);
  };

  const startTest = async (registeredUserId?: string) => {
    trackDiagnosticStarted();
    clearAllDiagnosticData();
    setStage(1);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setIsDontKnow(false);
    setR1Responses([]);
    setStage2Responses([]);
    setRoute(null);
    setResults(null);
    setTimeRemaining(TOTAL_TIME_SECONDS);
    setTimeExpiredAt(null);
    setShowTimeUpModal(false);
    setProfileSaved(false);

    const currentUserId = registeredUserId ?? userId;
    try {
      const data = await startTestAttempt(currentUserId);
      if (!data.success || !data.attemptId) throw new Error("No attemptId");
      setAttemptId(data.attemptId);
      saveAttemptId(data.attemptId);
    } catch (error) {
      console.error("Failed to start test:", error);
      const localId = generateLocalAttemptId();
      setAttemptId(localId);
      saveAttemptId(localId);
    }

    const now = Date.now();
    setTimerStartedAt(now);
    window.scrollTo(0, 0);
    setScreen("question");
    questionStartTime.current = now;
  };

  const continueToStage2 = () => {
    setStage(2);
    setQuestionIndex(0);
    resetQuestionState();
    setScreen("question");
  };

  const calculateAndShowResults = async () => {
    const counts = getResponseCounts();
    if (!route) {
      setScreen("maintenance");
      return;
    }
    const tier = getPerformanceTier(counts.scoredCorrect);
    trackDiagnosticCompleted(counts.scoredCorrect, tier, route);
    showResultsScreen();

    if (!isLocalAttempt(attemptId)) {
      const stage1Correct = getStoredResponses().filter(
        (r) => r.stage === 1 && !r.answeredAfterTimeUp && r.isCorrect
      ).length;
      try {
        await completeTestAttempt({
          attemptId,
          totalQuestions: 16,
          correctAnswers: counts.scoredCorrect,
          stage1Score: stage1Correct,
          stage2Difficulty: route,
        });
      } catch (error) {
        console.error("Failed to complete test:", error);
      }
    }
  };

  /** Submit response and advance to next question/stage/results */
  const handleNext = useCallback(
    async (
      correctAnswer: string | null,
      atoms: QuestionAtom[],
      alternateQuestionId: string | null
    ) => {
      const question = getCurrentQuestion();
      const responseTime = Math.floor(
        (Date.now() - questionStartTime.current) / 1000
      );
      const isCorrect =
        !isDontKnow &&
        selectedAnswer !== null &&
        correctAnswer !== null &&
        selectedAnswer === correctAnswer;

      const responseData: DiagnosticResponse = {
        question,
        selectedAnswer,
        isCorrect,
        responseTime,
        atoms,
      };
      const questionId = buildQuestionId(
        question.exam,
        question.questionNumber
      );

      await saveQuestionResponse({
        questionId,
        selectedAnswer: selectedAnswer || "skip",
        isCorrect,
        responseTimeSeconds: responseTime,
        stage,
        questionIndex,
        route: stage === 2 ? route : null,
        atoms: atoms.map((a) => ({
          atomId: a.atomId,
          relevance: a.relevance,
        })),
        answeredAfterTimeUp: timeExpiredAt !== null,
        alternateQuestionId: alternateQuestionId ?? undefined,
        attemptId,
      });

      if (stage === 1) {
        setR1Responses([...r1Responses, responseData]);
        if (questionIndex === QUESTIONS_PER_STAGE - 1) {
          const storedR1 = getStoredResponses().filter((r) => r.stage === 1);
          setRoute(getRoute(storedR1.filter((r) => r.isCorrect).length));
          setScreen("transition");
        } else {
          setQuestionIndex(questionIndex + 1);
          resetQuestionState();
        }
      } else {
        setStage2Responses([...stage2Responses, responseData]);
        if (questionIndex === QUESTIONS_PER_STAGE - 1) {
          calculateAndShowResults();
        } else {
          setQuestionIndex(questionIndex + 1);
          resetQuestionState();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isDontKnow,
      selectedAnswer,
      stage,
      questionIndex,
      route,
      attemptId,
      r1Responses,
      stage2Responses,
      timeExpiredAt,
    ]
  );

  // --- Profile handlers ---
  const saveProfileAndShowResults = async (profilingData?: ProfilingData) => {
    if (!route) throw new Error("Cannot save profile: route is not set");
    const result = await buildAndSaveProfile({
      userId,
      attemptId,
      route,
      topRouteInfo,
      profilingData,
    });
    setCachedResponsesForReview(getResponsesForReview());
    setCachedResults(result.calculatedResults);
    setCachedAtomResults(result.atomResults);
    setCachedScoredCorrect(result.scoredCorrect);
    setCachedActualRoute(result.actualRoute);
    setCachedRoutesData(routesData);
    clearAllDiagnosticData();
    setProfileSaved(true);
    setScreen("results");
  };

  const handleProfileSubmit = async (profilingData: ProfilingData) => {
    trackProfilingCompleted({
      paesGoal: !!profilingData.paesGoal,
      paesDate: !!profilingData.paesDate,
      inPreu: profilingData.inPreu !== undefined,
      schoolType: !!profilingData.schoolType,
    });
    await saveProfileAndShowResults(profilingData);
  };

  const handleProfileSkip = async () => {
    trackProfilingSkipped();
    await saveProfileAndShowResults();
  };

  return {
    screen,
    setScreen,
    stage,
    questionIndex,
    route,
    selectedAnswer,
    isDontKnow,
    results,
    consistentScore,
    setConsistentScore,
    topRouteInfo,
    setTopRouteInfo,
    profileSaved,
    cachedResults,
    cachedAtomResults,
    cachedScoredCorrect,
    cachedActualRoute,
    cachedResponsesForReview,
    cachedRoutesData,
    routesData,
    routesLoading,
    attemptId,
    timeRemaining,
    timeExpiredAt,
    showTimeUpModal,
    handleMiniFormSubmit,
    getCurrentQuestion,
    handleSelectAnswer,
    handleSelectDontKnow,
    handleNext,
    handleFatalError,
    handleTimeUp,
    handleContinueAfterTimeUp,
    handleViewResultsAfterTimeUp,
    continueToStage2,
    handleProfileSubmit,
    handleProfileSkip,
  };
}
