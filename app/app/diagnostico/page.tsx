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
} from "@/lib/diagnostic/storage";
import { type QuestionAtom } from "@/lib/diagnostic/qtiParser";
import {
  WelcomeScreen,
  QuestionScreen,
  TransitionScreen,
  ResultsScreen,
  SignupScreen,
  ThankYouScreen,
  MaintenanceScreen,
  DiagnosticHeader,
  OfflineIndicator,
} from "./components";

// ============================================================================
// TYPES
// ============================================================================

type Screen =
  | "welcome"
  | "question"
  | "transition"
  | "results"
  | "signup"
  | "thankyou"
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

  // Signup state
  const [email, setEmail] = useState("");
  const [signupStatus, setSignupStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [signupError, setSignupError] = useState("");

  // Timer and tracking state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_SECONDS);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Ref for timer callback (to avoid stale closure)
  const routeRef = useRef(route);

  // Keep ref in sync with state
  useEffect(() => {
    routeRef.current = route;
  }, [route]);

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

        // Calculate remaining time based on when timer started
        if (
          storedSession.screen === "question" ||
          storedSession.screen === "transition"
        ) {
          const remaining = calculateRemainingTime(
            storedSession.timerStartedAt
          );
          setTimeRemaining(remaining);
        }

        // Restore results if on results/signup screen
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
    // Don't save welcome or thankyou screens (these are entry/exit points)
    if (screen === "welcome" || screen === "thankyou") return;

    // Always calculate counts from localStorage (source of truth after refreshes)
    const storedResponses = getStoredResponses();
    const storedR1Correct = storedResponses
      .filter((r) => r.stage === 1)
      .filter((r) => r.isCorrect).length;
    const storedTotalCorrect = storedResponses.filter(
      (r) => r.isCorrect
    ).length;

    saveSessionState({
      screen,
      stage,
      questionIndex,
      route,
      r1Correct: storedR1Correct,
      totalCorrect: storedTotalCorrect,
      timerStartedAt: timerStartedAt || Date.now(),
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
    results,
  ]);

  // Calculate results when time runs out
  const handleTimeUp = useCallback(() => {
    const fallbackRoute = routeRef.current || "B";

    // Get data from localStorage (source of truth after refreshes)
    const reconstructedResponses = reconstructFullResponses(fallbackRoute);
    const actualRoute = getActualRouteFromStorage(fallbackRoute);

    const calculatedResults = calculateDiagnosticResults(
      reconstructedResponses,
      actualRoute
    );
    setResults(calculatedResults);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setScreen("results");
  }, []);

  // Timer effect
  useEffect(() => {
    if (screen === "question" && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            // Time's up - calculate results
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
  }, [screen, handleTimeUp]);

  // Start the test
  const startTest = async () => {
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

    try {
      const response = await fetch("/api/diagnostic/start", { method: "POST" });
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
    return getStage2Questions(route || "B")[questionIndex];
  };

  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setIsDontKnow(false);
  };
  const handleSelectDontKnow = () => {
    setIsDontKnow(true);
    setSelectedAnswer(null);
  };

  // Submit response and advance
  const handleNext = async (
    correctAnswer: string | null,
    atoms: QuestionAtom[]
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

    const questionId = buildQuestionId(question.exam, question.questionNumber);

    // Always save to localStorage as backup (in case API fails or is local)
    saveResponseToLocalStorage({
      questionId,
      selectedAnswer: selectedAnswer || "skip",
      isCorrect,
      responseTimeSeconds: responseTime,
      stage,
      questionIndex,
      route: stage === 2 ? route : null, // Save route for stage 2 reconstruction
      answeredAt: new Date().toISOString(),
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
  };

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
    // Get all data from localStorage (source of truth after refreshes)
    const storedResponses = getStoredResponses();
    const totalCorrect = storedResponses.filter((r) => r.isCorrect).length;
    const stage1Correct = storedResponses
      .filter((r) => r.stage === 1)
      .filter((r) => r.isCorrect).length;

    const finalRoute = route || "B";
    showResults(totalCorrect, finalRoute);

    // Complete test on API if we have a valid (non-local) attempt
    if (!isLocalAttempt(attemptId)) {
      try {
        await fetch("/api/diagnostic/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            totalQuestions: 16,
            correctAnswers: totalCorrect,
            stage1Score: stage1Correct,
            stage2Difficulty: finalRoute,
          }),
        });
      } catch (error) {
        console.error("Failed to complete test:", error);
      }
    }
  };

  // Shared results display logic
  const showResults = (totalCorrect: number, fallbackRoute: Route) => {
    const reconstructedResponses = reconstructFullResponses(fallbackRoute);
    const actualRoute = getActualRouteFromStorage(fallbackRoute);

    const calculatedResults = calculateDiagnosticResults(
      reconstructedResponses,
      actualRoute
    );
    setResults(calculatedResults);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setScreen("results");
  };

  // Handle email signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSignupStatus("loading");
    setSignupError("");

    try {
      // Get all data from localStorage (source of truth)
      const storedResponses = getStoredResponses();
      const fallbackRoute = route || "B";
      const reconstructedResponses = reconstructFullResponses(fallbackRoute);
      const actualRoute = getActualRouteFromStorage(fallbackRoute);

      const atomResults = computeAtomMastery(reconstructedResponses);
      const isLocal = isLocalAttempt(attemptId);
      const calculatedResults = calculateDiagnosticResults(
        reconstructedResponses,
        actualRoute
      );

      // Build signup payload with all available data
      const signupPayload = {
        email,
        attemptId: isLocal ? null : attemptId,
        atomResults,
        // Include diagnostic results for local attempts
        diagnosticData: isLocal
          ? {
              responses: storedResponses,
              results: {
                paesMin: calculatedResults.paesMin,
                paesMax: calculatedResults.paesMax,
                level: calculatedResults.level,
                route: actualRoute,
                totalCorrect: storedResponses.filter((r) => r.isCorrect).length,
              },
            }
          : null,
      };

      const response = await fetch("/api/diagnostic/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupPayload),
      });
      const data = await response.json();

      if (data.success) {
        // Clear all localStorage data after successful signup
        clearAllDiagnosticData();
        setSignupStatus("success");
        setScreen("thankyou");
      } else {
        throw new Error(data.error || "Error al guardar");
      }
    } catch (error) {
      setSignupStatus("error");
      setSignupError(
        error instanceof Error ? error.message : "Error desconocido"
      );
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Welcome screen
  if (screen === "welcome") {
    return <WelcomeScreen onStart={startTest} />;
  }

  // Question screen
  if (screen === "question") {
    const question = getCurrentQuestion();
    const totalQuestions = 16;
    const currentQuestionNumber =
      stage === 1 ? questionIndex + 1 : 8 + questionIndex + 1;
    const isOfflineMode = isLocalAttempt(attemptId);

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
            onFatalError={() => setScreen("maintenance")}
          />
        </div>

        {/* Offline mode indicator */}
        {isOfflineMode && <OfflineIndicator />}
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

  // Results screen
  if (screen === "results") {
    // Always get data from localStorage (source of truth after refreshes)
    const storedResponses = getStoredResponses();
    const totalCorrect = storedResponses.filter((r) => r.isCorrect).length;
    const fallbackRoute = route || "B";
    const reconstructedResponses = reconstructFullResponses(fallbackRoute);
    const actualRoute = getActualRouteFromStorage(fallbackRoute);

    // ALWAYS recalculate results from localStorage data (source of truth)
    // This ensures axisPerformance and skillPerformance are correct after refresh
    const calculatedResults = calculateDiagnosticResults(
      reconstructedResponses,
      actualRoute
    );

    // Compute atom results from reconstructed responses
    const atomResults = computeAtomMastery(reconstructedResponses);

    // Prepare responses for review drawer
    const responsesForReview = getResponsesForReview(actualRoute);

    return (
      <ResultsScreen
        results={calculatedResults}
        route={actualRoute}
        totalCorrect={totalCorrect}
        atomResults={atomResults}
        responses={responsesForReview}
        onSignup={() => setScreen("signup")}
        onScoreCalculated={setConsistentScore}
      />
    );
  }

  // Signup screen
  if (screen === "signup") {
    // Use consistent score from API if available, otherwise fall back to old calculation
    let displayScore = consistentScore;

    if (!displayScore) {
      // Fallback: recalculate from localStorage (less accurate but works if API failed)
      const fallbackRoute = route || "B";
      const reconstructedResponses = reconstructFullResponses(fallbackRoute);
      const actualRoute = getActualRouteFromStorage(fallbackRoute);
      const calculatedResults = calculateDiagnosticResults(
        reconstructedResponses,
        actualRoute
      );
      displayScore = Math.round(
        (calculatedResults.paesMin + calculatedResults.paesMax) / 2
      );
    }

    return (
      <SignupScreen
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleSignup}
        status={signupStatus}
        error={signupError}
        onSkip={() => {
          clearAllDiagnosticData();
          setScreen("thankyou");
        }}
        score={displayScore}
      />
    );
  }

  // Thank you screen
  if (screen === "thankyou") {
    return (
      <ThankYouScreen
        hasEmail={signupStatus === "success"}
        onReconsider={
          signupStatus !== "success" ? () => setScreen("signup") : undefined
        }
      />
    );
  }

  // Maintenance screen - shown when questions fail to load after retries
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
