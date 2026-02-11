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
  calculateDiagnosticResults,
  computeAtomMastery,
  type DiagnosticResponse,
  type DiagnosticResults,
} from "@/lib/diagnostic/resultsCalculator";
import {
  saveResponseToLocalStorage,
  getStoredResponses,
  saveAttemptId,
  getStoredAttemptId,
  isLocalAttempt,
  generateLocalAttemptId,
  saveSessionState,
  getStoredSessionState,
  calculateRemainingTime,
  clearAllDiagnosticData,
  getResponsesForReview,
  reconstructFullResponses,
  getActualRouteFromStorage,
  getResponseCounts,
  type ResponseForReview,
} from "@/lib/diagnostic/storage";
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
import {
  WelcomeScreen,
  MiniFormScreen,
  type MiniFormData,
  QuestionScreen,
  TransitionScreen,
  PartialResultsScreen,
  ProfilingScreen,
  type ProfilingData,
  ResultsScreen,
  MaintenanceScreen,
  DiagnosticHeader,
  OfflineIndicator,
  TimeUpModal,
  type TopRouteInfo,
} from "./components";
import {
  type LearningRoutesResponse,
  sortRoutesByImpact,
} from "./hooks/useLearningRoutes";

// ============================================================================
// TYPES
// ============================================================================

type Screen =
  | "welcome"
  | "mini-form"
  | "question"
  | "transition"
  | "partial-results"
  | "profiling"
  | "results"
  | "maintenance";

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_TIME_SECONDS = 30 * 60; // 30 minutes

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DiagnosticoPage() {
  // Navigation and test progress state
  const [screen, setScreen] = useState<Screen>("welcome");
  const [stage, setStage] = useState<1 | 2>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isDontKnow, setIsDontKnow] = useState(false);

  // Responses and results state
  const [r1Responses, setR1Responses] = useState<DiagnosticResponse[]>([]);
  const [stage2Responses, setStage2Responses] = useState<DiagnosticResponse[]>(
    []
  );
  const [route, setRoute] = useState<Route | null>(null);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  // Consistent PAES score from API (based on unlocked questions)
  // This is set by ResultsScreen when the learning routes API returns
  const [consistentScore, setConsistentScore] = useState<number | null>(null);

  // Top route info from ResultsScreen
  const [topRouteInfo, setTopRouteInfo] = useState<TopRouteInfo | null>(null);

  // User ID (set after mini-form registration, before test starts)
  const [userId, setUserId] = useState<string | null>(null);

  // Profile save status (tracks whether profile API call succeeded)
  const [profileSaved, setProfileSaved] = useState(false);

  // Cached data for results screen after profile save (localStorage gets cleared)
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

  // Learning routes state (fetched when showing partial results)
  const [routesData, setRoutesData] = useState<LearningRoutesResponse | null>(
    null
  );
  const [routesLoading, setRoutesLoading] = useState(false);
  const [cachedRoutesData, setCachedRoutesData] =
    useState<LearningRoutesResponse | null>(null);

  // Timer and tracking state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_SECONDS);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timeExpiredAt, setTimeExpiredAt] = useState<number | null>(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Ref for timer callback (to avoid stale closure)
  const routeRef = useRef(route);

  // Keep ref in sync with state
  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  // Track diagnostic intro view on mount (before user clicks "Comenzar")
  useEffect(() => {
    trackDiagnosticIntroViewed();
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedSession = getStoredSessionState();
    const storedAttemptId = getStoredAttemptId();

    if (storedSession && storedAttemptId) {
      // Restore attempt ID
      setAttemptId(storedAttemptId);

      // Restore screen state (but not welcome - that means no active session)
      if (storedSession.screen !== "welcome") {
        setScreen(storedSession.screen);
        setStage(storedSession.stage);
        setQuestionIndex(storedSession.questionIndex);
        setRoute(storedSession.route);
        setTimerStartedAt(storedSession.timerStartedAt);

        // Restore time expired state if set
        if (storedSession.timeExpiredAt) {
          setTimeExpiredAt(storedSession.timeExpiredAt);
          setTimeRemaining(0);
        } else if (
          storedSession.screen === "question" ||
          storedSession.screen === "transition"
        ) {
          // Calculate remaining time based on when timer started
          const remaining = calculateRemainingTime(
            storedSession.timerStartedAt
          );
          // If time has expired during the page being closed, set timeExpiredAt
          if (remaining <= 0) {
            const expiredAt =
              storedSession.timerStartedAt + TOTAL_TIME_SECONDS * 1000;
            setTimeExpiredAt(expiredAt);
            setTimeRemaining(0);
          } else {
            setTimeRemaining(remaining);
          }
        }

        // Restore results if on results/profiling screen
        if (storedSession.results) {
          // We need full DiagnosticResults, but storage only has summary
          // The full axis performance will be recalculated from responses
          setResults(storedSession.results as DiagnosticResults);
        }
      }
    }
    setIsRestored(true);
  }, []);

  // Save session state when it changes
  useEffect(() => {
    // Don't save until initial restoration is complete
    if (!isRestored) return;
    // Don't save welcome or mini-form screens (these are entry points)
    if (screen === "welcome" || screen === "mini-form") return;

    // Always calculate counts from localStorage (source of truth after refreshes)
    const storedResponses = getStoredResponses();
    const storedR1Correct = storedResponses
      .filter((r) => r.stage === 1)
      .filter((r) => r.isCorrect).length;
    const storedTotalCorrect = storedResponses.filter(
      (r) => r.isCorrect
    ).length;

    if (!timerStartedAt) {
      console.error("Attempting to save session but timerStartedAt is not set");
      return;
    }

    saveSessionState({
      screen,
      stage,
      questionIndex,
      route,
      r1Correct: storedR1Correct,
      totalCorrect: storedTotalCorrect,
      timerStartedAt,
      timeExpiredAt,
      results: results
        ? {
            paesMin: results.paesMin,
            paesMax: results.paesMax,
            level: results.level,
            axisPerformance: results.axisPerformance,
          }
        : null,
    });
  }, [
    isRestored,
    screen,
    stage,
    questionIndex,
    route,
    timerStartedAt,
    timeExpiredAt,
    results,
  ]);

  // Handle time expiration - show modal to let user choose to continue or see results
  const handleTimeUp = useCallback(() => {
    // Mark the exact moment time expired
    const now = Date.now();
    setTimeExpiredAt(now);
    setTimeRemaining(0);

    // Clear the timer interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Show the time-up modal instead of going directly to results
    setShowTimeUpModal(true);
  }, []);

  // Handler for "Continue" button in time-up modal
  const handleContinueAfterTimeUp = useCallback(() => {
    setShowTimeUpModal(false);
    // User can continue answering, but responses will be marked as overtime
  }, []);

  // Handler for "View Results" button in time-up modal (or when all questions done)
  const handleViewResultsAfterTimeUp = useCallback(() => {
    setShowTimeUpModal(false);

    const currentRoute = routeRef.current;
    if (!currentRoute) {
      console.error("handleViewResultsAfterTimeUp called but route is not set");
      setScreen("maintenance");
      return;
    }

    // Get ONLY responses answered before time expired (for scoring)
    const scoredResponses = reconstructFullResponses({ excludeOvertime: true });
    const actualRoute = getActualRouteFromStorage(currentRoute);

    const calculatedResults = calculateDiagnosticResults(
      scoredResponses,
      actualRoute
    );
    setResults(calculatedResults);

    // Set consistent score for profiling screen (midpoint of range)
    const midScore = Math.round(
      (calculatedResults.paesMin + calculatedResults.paesMax) / 2
    );
    setConsistentScore(midScore);

    // Go to partial results first (gated flow)
    setScreen("partial-results");
  }, []);

  // Timer effect - only runs if time hasn't expired yet
  useEffect(() => {
    // Don't start timer if time has already expired (overtime mode)
    if (timeExpiredAt !== null) return;

    if (screen === "question" && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            // Time's up - show modal
            setTimeout(() => {
              handleTimeUp();
            }, 0);
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

  // Handle mini-form submission: register user, then start the test
  const handleMiniFormSubmit = async (data: MiniFormData) => {
    // Call register API to create user
    const registerRes = await fetch("/api/diagnostic/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        userType: data.userType,
        curso: data.curso,
      }),
    });
    const registerData = await registerRes.json();

    if (!registerData.success || !registerData.userId) {
      throw new Error(registerData.error || "Error al registrar");
    }

    // Track mini-form completion (also identifies user in analytics)
    trackMiniFormCompleted(data.email, data.userType, data.curso);

    setUserId(registerData.userId);

    // Now start the test with the registered userId
    await startTest(registerData.userId);
  };

  // Start the test (called after mini-form registration)
  const startTest = async (registeredUserId?: string) => {
    // Track diagnostic started event
    trackDiagnosticStarted();

    // Clear any previous session data when starting fresh
    clearAllDiagnosticData();

    // Reset all state for a fresh test
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
      // Timeout after 10s to prevent hanging on stale DB connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/diagnostic/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!data.success || !data.attemptId) {
        throw new Error(data.error || "Failed to create test attempt");
      }

      setAttemptId(data.attemptId);
      saveAttemptId(data.attemptId);
    } catch (error) {
      console.error("Failed to start test:", error);
      // Create local fallback ID so test can proceed
      const localId = generateLocalAttemptId();
      setAttemptId(localId);
      saveAttemptId(localId);
    }

    // Set timer start time for session persistence
    const now = Date.now();
    setTimerStartedAt(now);

    // Scroll to top when starting the test
    window.scrollTo(0, 0);
    setScreen("question");
    questionStartTime.current = now;
  };

  // Get current question
  const getCurrentQuestion = (): MSTQuestion => {
    if (stage === 1) {
      return MST_QUESTIONS.R1[questionIndex];
    }
    if (!route) {
      throw new Error(
        "getCurrentQuestion called for stage 2 but route is not set"
      );
    }
    return getStage2Questions(route)[questionIndex];
  };

  // Handle answer selection (memoized to prevent QuestionScreen re-renders)
  const handleSelectAnswer = useCallback((answer: string) => {
    setSelectedAnswer(answer);
    setIsDontKnow(false);
  }, []);

  const handleSelectDontKnow = useCallback(() => {
    setIsDontKnow(true);
    setSelectedAnswer(null);
  }, []);

  // Submit response and advance (memoized to prevent QuestionScreen re-renders from timer)
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

      // Determine correctness - check against real correct answer from DB
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

      // Always save to localStorage as backup (in case API fails or is local)
      // Include atoms for mastery calculation (needed for PAES score from unlocked questions)
      // Mark as overtime if time has already expired (for diagnostic only, not scoring)
      saveResponseToLocalStorage({
        questionId,
        selectedAnswer: selectedAnswer || "skip",
        isCorrect,
        responseTimeSeconds: responseTime,
        stage,
        questionIndex,
        route: stage === 2 ? route : null, // Save route for stage 2 reconstruction
        answeredAt: new Date().toISOString(),
        atoms: atoms.map((a) => ({ atomId: a.atomId, relevance: a.relevance })),
        answeredAfterTimeUp: timeExpiredAt !== null,
        alternateQuestionId: alternateQuestionId ?? undefined,
      });

      // Also save response to API if we have a valid (non-local) attempt
      if (!isLocalAttempt(attemptId)) {
        try {
          await fetch("/api/diagnostic/response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attemptId,
              questionId,
              selectedAnswer: selectedAnswer || "skip",
              isCorrect,
              responseTime,
              stage,
              questionIndex,
            }),
          });
        } catch (error) {
          console.error("Failed to save response to API:", error);
          // Response is still saved in localStorage as backup
        }
      }

      // Update state based on stage
      if (stage === 1) {
        const newResponses = [...r1Responses, responseData];
        setR1Responses(newResponses);

        if (questionIndex === QUESTIONS_PER_STAGE - 1) {
          // Get correct count from localStorage (source of truth after refreshes)
          const storedR1 = getStoredResponses().filter((r) => r.stage === 1);
          const correctCount = storedR1.filter((r) => r.isCorrect).length;
          const determinedRoute = getRoute(correctCount);
          setRoute(determinedRoute);
          setScreen("transition");
        } else {
          setQuestionIndex(questionIndex + 1);
          resetQuestionState();
        }
      } else {
        const newResponses = [...stage2Responses, responseData];
        setStage2Responses(newResponses);

        if (questionIndex === QUESTIONS_PER_STAGE - 1) {
          calculateAndShowResults(newResponses);
        } else {
          setQuestionIndex(questionIndex + 1);
          resetQuestionState();
        }
      }
    },
    // Note: getCurrentQuestion, resetQuestionState, calculateAndShowResults are intentionally omitted.
    // They only use state values already in this dependency array, so they don't need to be listed.
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

  // Stable callback for fatal errors (memoized to prevent QuestionScreen re-renders)
  const handleFatalError = useCallback(() => {
    setScreen("maintenance");
  }, []);

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setIsDontKnow(false);
    questionStartTime.current = Date.now();
  };

  // Scroll to top on any screen or question change (after React renders)
  useEffect(() => {
    // Use requestAnimationFrame to ensure scroll happens after content renders
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [screen, questionIndex, stage]);
  const continueToStage2 = () => {
    setStage(2);
    setQuestionIndex(0);
    resetQuestionState();
    setScreen("question");
  };

  // Calculate and display results
  const calculateAndShowResults = async (
    _finalStage2Responses: DiagnosticResponse[]
  ) => {
    // Get response counts (only scored responses for scoring, all for diagnostics)
    const counts = getResponseCounts();

    if (!route) {
      console.error("calculateAndShowResults called but route is not set");
      setScreen("maintenance");
      return;
    }

    // Track diagnostic completed event (use scored correct only)
    const performanceTier = getPerformanceTier(counts.scoredCorrect);
    trackDiagnosticCompleted(counts.scoredCorrect, performanceTier, route);

    showResults();

    // Calculate stage 1 correct from scored responses only
    const storedResponses = getStoredResponses();
    const stage1Correct = storedResponses
      .filter((r) => r.stage === 1 && !r.answeredAfterTimeUp)
      .filter((r) => r.isCorrect).length;

    // Complete test on API if we have a valid (non-local) attempt
    if (!isLocalAttempt(attemptId)) {
      try {
        await fetch("/api/diagnostic/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            totalQuestions: 16,
            correctAnswers: counts.scoredCorrect,
            stage1Score: stage1Correct,
            stage2Difficulty: route,
          }),
        });
      } catch (error) {
        console.error("Failed to complete test:", error);
      }
    }
  };

  // Shared results display logic - shows partial results first (gated flow)
  const showResults = () => {
    if (!route) {
      console.error("showResults called but route is not set");
      setScreen("maintenance");
      return;
    }
    // Only use responses answered before time expired for scoring
    const scoredResponses = reconstructFullResponses({ excludeOvertime: true });
    const actualRoute = getActualRouteFromStorage(route);

    const calculatedResults = calculateDiagnosticResults(
      scoredResponses,
      actualRoute
    );
    setResults(calculatedResults);

    // Set consistent score for profiling screen (midpoint of range)
    const midScore = Math.round(
      (calculatedResults.paesMin + calculatedResults.paesMax) / 2
    );
    setConsistentScore(midScore);

    // Compute atom mastery from ALL responses (for learning routes)
    const allResponses = reconstructFullResponses();
    const atomResults = computeAtomMastery(allResponses);

    // Fetch learning routes for improvement data (used in PartialResultsScreen)
    fetchLearningRoutes(atomResults, midScore);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Go to partial results first (gated flow)
    setScreen("partial-results");
  };

  // Fetch learning routes for improvement predictions
  const fetchLearningRoutes = async (
    atomResults: { atomId: string; mastered: boolean }[],
    diagnosticScore: number
  ) => {
    setRoutesLoading(true);
    try {
      const response = await fetch("/api/diagnostic/learning-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atomResults, diagnosticScore }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setRoutesData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch learning routes:", error);
      // Routes will remain null - UI will show generic message
    } finally {
      setRoutesLoading(false);
    }
  };

  /**
   * Saves profile data (with or without profiling fields) and transitions
   * to the full results screen. Called from both profiling submit and skip.
   */
  const saveProfileAndShowResults = async (profilingData?: ProfilingData) => {
    if (!route) {
      throw new Error("Cannot save profile: route is not set");
    }

    const storedResponses = getStoredResponses();
    const actualRoute = getActualRouteFromStorage(route);

    // Use ALL responses for atom mastery (diagnostic purposes)
    const allResponses = reconstructFullResponses();
    const atomResults = computeAtomMastery(allResponses);

    // Use only SCORED responses for results calculation
    const scoredResponses = reconstructFullResponses({
      excludeOvertime: true,
    });
    const isLocal = isLocalAttempt(attemptId);
    const calculatedResults = calculateDiagnosticResults(
      scoredResponses,
      actualRoute
    );

    const counts = getResponseCounts();
    const performanceTier = getPerformanceTier(counts.scoredCorrect);

    // Build profile payload
    const profilePayload = {
      userId,
      attemptId: isLocal ? null : attemptId,
      profilingData,
      atomResults,
      diagnosticData: {
        responses: isLocal ? storedResponses : [],
        results: {
          paesMin: calculatedResults.paesMin,
          paesMax: calculatedResults.paesMax,
          level: calculatedResults.level,
          route: actualRoute,
          totalCorrect: counts.scoredCorrect,
          performanceTier,
          topRoute: topRouteInfo ?? undefined,
        },
      },
    };

    const response = await fetch("/api/diagnostic/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profilePayload),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Error al guardar perfil");
    }

    // Cache ALL data BEFORE clearing localStorage
    const responsesToCache = getResponsesForReview();
    setCachedResponsesForReview(responsesToCache);
    setCachedResults(calculatedResults);
    setCachedAtomResults(atomResults);
    setCachedScoredCorrect(counts.scoredCorrect);
    setCachedActualRoute(actualRoute);
    setCachedRoutesData(routesData);

    // Clear localStorage after successful save
    clearAllDiagnosticData();
    setProfileSaved(true);

    // Go to full results screen
    setScreen("results");
  };

  // Handle profiling form submission
  const handleProfileSubmit = async (profilingData: ProfilingData) => {
    trackProfilingCompleted({
      paesGoal: !!profilingData.paesGoal,
      paesDate: !!profilingData.paesDate,
      inPreu: profilingData.inPreu !== undefined,
      schoolType: !!profilingData.schoolType,
    });

    await saveProfileAndShowResults(profilingData);
  };

  // Handle profiling skip
  const handleProfileSkip = async () => {
    trackProfilingSkipped();
    await saveProfileAndShowResults();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Welcome screen → goes to mini-form (not directly to test)
  if (screen === "welcome") {
    return <WelcomeScreen onStart={() => setScreen("mini-form")} />;
  }

  // Mini-form screen → register user then start test
  if (screen === "mini-form") {
    return <MiniFormScreen onSubmit={handleMiniFormSubmit} />;
  }

  // Question screen
  if (screen === "question") {
    const question = getCurrentQuestion();
    const totalQuestions = 16;
    const currentQuestionNumber =
      stage === 1 ? questionIndex + 1 : 8 + questionIndex + 1;
    const isOfflineMode = isLocalAttempt(attemptId);
    const isOvertime = timeExpiredAt !== null;
    const answeredCount = getStoredResponses().filter(
      (r) => !r.answeredAfterTimeUp
    ).length;

    return (
      <div className="min-h-screen relative">
        {/* Background decorations */}
        <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
        <div
          className="fixed top-20 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="fixed bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          aria-hidden="true"
        />

        {/* Header with progress and timer */}
        <DiagnosticHeader
          currentQuestion={currentQuestionNumber}
          totalQuestions={totalQuestions}
          timeRemaining={timeRemaining}
          stage={stage}
          route={route}
          isOvertime={isOvertime}
        />

        <div className="relative z-10">
          <QuestionScreen
            question={question}
            questionIndex={questionIndex}
            selectedAnswer={selectedAnswer}
            isDontKnow={isDontKnow}
            onSelectAnswer={handleSelectAnswer}
            onSelectDontKnow={handleSelectDontKnow}
            onNext={handleNext}
            onFatalError={handleFatalError}
          />
        </div>

        {/* Offline mode indicator */}
        {isOfflineMode && <OfflineIndicator />}

        {/* Time up modal */}
        <TimeUpModal
          isOpen={showTimeUpModal}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          onViewResults={handleViewResultsAfterTimeUp}
          onContinue={handleContinueAfterTimeUp}
        />
      </div>
    );
  }

  // Transition screen
  if (screen === "transition" && route) {
    // Always get count from localStorage (source of truth)
    const storedR1 = getStoredResponses().filter((r) => r.stage === 1);
    const r1Correct = storedR1.filter((r) => r.isCorrect).length;
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-off-white">
        <TransitionScreen
          r1Correct={r1Correct}
          route={route}
          onContinue={continueToStage2}
        />
      </div>
    );
  }

  // Partial Results screen (gated - shows score, teases full results)
  if (screen === "partial-results") {
    if (!route) {
      console.error("Partial results screen rendered but route is not set");
      return <MaintenanceScreen />;
    }

    // Get response counts (only scored responses for scoring)
    const counts = getResponseCounts();
    const actualRoute = getActualRouteFromStorage(route);

    // Calculate results for display
    const scoredResponses = reconstructFullResponses({ excludeOvertime: true });
    const calculatedResults = calculateDiagnosticResults(
      scoredResponses,
      actualRoute
    );

    // Get improvement data from the top route (if routes have loaded)
    let potentialImprovement = 0;
    let studyHours = 0;
    if (routesData?.routes && routesData.routes.length > 0) {
      const sortedRoutes = sortRoutesByImpact(routesData.routes);
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
        routesLoading={routesLoading}
        onContinue={() => setScreen("profiling")}
        onSkip={handleProfileSkip}
      />
    );
  }

  // Full Results screen (shown after profiling or skip)
  if (screen === "results") {
    // After profile save, localStorage is cleared — use cached data
    // Otherwise (session restore, etc.) read from localStorage
    let finalResults: DiagnosticResults;
    let finalAtomResults: { atomId: string; mastered: boolean }[];
    let finalScoredCorrect: number;
    let finalRoute: Route;
    let responsesForReview: ResponseForReview[];
    let precomputedRoutes: LearningRoutesResponse | null = null;

    if (profileSaved && cachedResults && cachedActualRoute) {
      // Use cached data (localStorage was cleared after profile save)
      finalResults = cachedResults;
      finalAtomResults = cachedAtomResults;
      finalScoredCorrect = cachedScoredCorrect;
      finalRoute = cachedActualRoute;
      responsesForReview = cachedResponsesForReview;
      precomputedRoutes = cachedRoutesData;
    } else {
      // Read from localStorage (session restore)
      if (!route) {
        console.error("Results screen rendered but route is not set");
        return <MaintenanceScreen />;
      }

      const counts = getResponseCounts();
      const actualRoute = getActualRouteFromStorage(route);
      const scoredResponses = reconstructFullResponses({
        excludeOvertime: true,
      });
      const calculatedResults = calculateDiagnosticResults(
        scoredResponses,
        actualRoute
      );
      const allResponses = reconstructFullResponses();
      const atomResults = computeAtomMastery(allResponses);

      finalResults = calculatedResults;
      finalAtomResults = atomResults;
      finalScoredCorrect = counts.scoredCorrect;
      finalRoute = actualRoute;
      responsesForReview = getResponsesForReview();
      precomputedRoutes = routesData;
    }

    return (
      <ResultsScreen
        results={finalResults}
        route={finalRoute}
        totalCorrect={finalScoredCorrect}
        atomResults={finalAtomResults}
        responses={responsesForReview}
        onScoreCalculated={setConsistentScore}
        onTopRouteCalculated={setTopRouteInfo}
        hasSignedUp={profileSaved}
        precomputedRoutes={precomputedRoutes ?? undefined}
      />
    );
  }

  // Profiling screen (optional profiling after partial results)
  if (screen === "profiling") {
    return (
      <ProfilingScreen
        score={consistentScore ?? undefined}
        onSubmit={handleProfileSubmit}
        onSkip={handleProfileSkip}
      />
    );
  }

  // Maintenance screen — shown when questions fail to load after retries
  if (screen === "maintenance") {
    return <MaintenanceScreen />;
  }

  // Fallback loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
