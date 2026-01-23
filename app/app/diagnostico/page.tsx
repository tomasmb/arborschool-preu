"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MST_QUESTIONS,
  getRoute,
  getStage2Questions,
  buildQuestionId,
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
  clearStoredResponses,
  saveAttemptId,
  isLocalAttempt,
  generateLocalAttemptId,
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
  const [stage2Responses, setStage2Responses] = useState<DiagnosticResponse[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [results, setResults] = useState<DiagnosticResults | null>(null);

  // Signup state
  const [email, setEmail] = useState("");
  const [signupStatus, setSignupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [signupError, setSignupError] = useState("");

  // Timer and tracking state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Refs for timer callback (to avoid stale closures)
  const r1ResponsesRef = useRef(r1Responses);
  const stage2ResponsesRef = useRef(stage2Responses);
  const routeRef = useRef(route);

  // Keep refs in sync with state
  useEffect(() => { r1ResponsesRef.current = r1Responses; }, [r1Responses]);
  useEffect(() => { stage2ResponsesRef.current = stage2Responses; }, [stage2Responses]);
  useEffect(() => { routeRef.current = route; }, [route]);

  // Calculate results when time runs out
  const handleTimeUp = useCallback(() => {
    const allResponses = [
      ...r1ResponsesRef.current,
      ...stage2ResponsesRef.current,
    ];
    const finalRoute = routeRef.current || "B";

    // Use consolidated results calculator
    const calculatedResults = calculateDiagnosticResults(allResponses, finalRoute);
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
    setScreen("question");
    questionStartTime.current = Date.now();
  };

  // Get current question
  const getCurrentQuestion = (): MSTQuestion => {
    if (stage === 1) {
      return MST_QUESTIONS.R1[questionIndex];
    }
    return getStage2Questions(route || "B")[questionIndex];
  };

  // Handle answer selection
  const handleSelectAnswer = (answer: string) => { setSelectedAnswer(answer); setIsDontKnow(false); };
  const handleSelectDontKnow = () => { setIsDontKnow(true); setSelectedAnswer(null); };

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

      if (questionIndex === 7) {
        const correctCount = newResponses.filter((r) => r.isCorrect).length;
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

      if (questionIndex === 7) {
        calculateAndShowResults(newResponses);
      } else {
        setQuestionIndex(questionIndex + 1);
        resetQuestionState();
      }
    }
  };

  const resetQuestionState = () => { setSelectedAnswer(null); setIsDontKnow(false); questionStartTime.current = Date.now(); };
  const continueToStage2 = () => { setStage(2); setQuestionIndex(0); resetQuestionState(); setScreen("question"); };

  // Calculate and display results
  const calculateAndShowResults = async (finalStage2Responses: DiagnosticResponse[]) => {
    const allResponses = [...r1Responses, ...finalStage2Responses];
    const finalRoute = route || "B";
    showResults(allResponses, finalRoute);

    // Complete test on API if we have a valid (non-local) attempt
    if (!isLocalAttempt(attemptId)) {
      try {
        await fetch("/api/diagnostic/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            totalQuestions: 16,
            correctAnswers: allResponses.filter((r) => r.isCorrect).length,
            stage1Score: r1Responses.filter((r) => r.isCorrect).length,
            stage2Difficulty: finalRoute,
          }),
        });
      } catch (error) {
        console.error("Failed to complete test:", error);
      }
    }
  };

  // Shared results display logic
  const showResults = (allResponses: DiagnosticResponse[], finalRoute: Route) => {
    // Use consolidated results calculator
    const calculatedResults = calculateDiagnosticResults(allResponses, finalRoute);
    setResults(calculatedResults);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setScreen("results");
  };

  // Compute atom mastery from all responses
  const getAtomResults = () => computeAtomMastery([...r1Responses, ...stage2Responses]);

  // Handle email signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSignupStatus("loading");
    setSignupError("");

    try {
      const atomResults = getAtomResults();
      const storedResponses = getStoredResponses();
      const isLocal = isLocalAttempt(attemptId);

      // Build signup payload with all available data
      const signupPayload = {
        email,
        attemptId: isLocal ? null : attemptId,
        atomResults,
        // Include diagnostic results for local attempts
        diagnosticData: isLocal
          ? {
              responses: storedResponses,
              results: results
                ? {
                    paesMin: results.paesMin,
                    paesMax: results.paesMax,
                    level: results.level,
                    route,
                    totalCorrect: [...r1Responses, ...stage2Responses].filter(
                      (r) => r.isCorrect
                    ).length,
                  }
                : null,
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
        // Clear localStorage backup after successful signup
        clearStoredResponses();
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Background decorations */}
        <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
        <div className="fixed top-20 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" aria-hidden="true" />
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" aria-hidden="true" />

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
    const r1Correct = r1Responses.filter((r) => r.isCorrect).length;
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
  if (screen === "results" && results) {
    const allResponses = [...r1Responses, ...stage2Responses];
    const totalCorrect = allResponses.filter((r) => r.isCorrect).length;
    const atomResults = getAtomResults();

    // Prepare responses for review (strip atoms to reduce data)
    const responsesForReview = allResponses.map((r) => ({
      question: r.question,
      selectedAnswer: r.selectedAnswer,
      isCorrect: r.isCorrect,
    }));

    return (
      <ResultsScreen
        results={results}
        route={route || "B"}
        totalCorrect={totalCorrect}
        atomResults={atomResults}
        responses={responsesForReview}
        onSignup={() => setScreen("signup")}
      />
    );
  }

  // Signup screen
  if (screen === "signup") {
    return (
      <SignupScreen
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleSignup}
        status={signupStatus}
        error={signupError}
        onSkip={() => setScreen("thankyou")}
      />
    );
  }

  // Thank you screen
  if (screen === "thankyou") {
    return <ThankYouScreen hasEmail={signupStatus === "success"} />;
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
