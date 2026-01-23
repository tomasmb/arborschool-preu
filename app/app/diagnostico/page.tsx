"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MST_QUESTIONS,
  getRoute,
  getStage2Questions,
  buildQuestionId,
  calculatePAESScore,
  calculateAxisPerformance,
  calculateSkillPerformance,
  type MSTQuestion,
  type Route,
  type Axis,
  type Skill,
} from "@/lib/diagnostic/config";
import {
  WelcomeScreen,
  QuestionScreen,
  TransitionScreen,
  ResultsScreen,
  SignupScreen,
  ThankYouScreen,
  type QuestionAtom,
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

interface Response {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
  responseTime: number;
  atoms: QuestionAtom[];
}

interface Results {
  paesMin: number;
  paesMax: number;
  level: string;
  axisPerformance: Record<
    Axis,
    { correct: number; total: number; percentage: number }
  >;
  skillPerformance: Record<
    Skill,
    { correct: number; total: number; percentage: number }
  >;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ATTEMPT_STORAGE_KEY = "arbor_diagnostic_attempt";
const RESPONSES_STORAGE_KEY = "arbor_diagnostic_responses";
const TOTAL_TIME_SECONDS = 30 * 60; // 30 minutes

// ============================================================================
// LOCAL STORAGE BACKUP HELPERS
// ============================================================================

interface StoredResponse {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  responseTimeSeconds: number;
  stage: 1 | 2;
  questionIndex: number;
  answeredAt: string;
}

function saveResponseToLocalStorage(response: StoredResponse) {
  try {
    const existing = localStorage.getItem(RESPONSES_STORAGE_KEY);
    const responses: StoredResponse[] = existing ? JSON.parse(existing) : [];
    responses.push(response);
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
  } catch (error) {
    console.error("Failed to save response to localStorage:", error);
  }
}

function getStoredResponses(): StoredResponse[] {
  try {
    const stored = localStorage.getItem(RESPONSES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function clearStoredResponses() {
  try {
    localStorage.removeItem(RESPONSES_STORAGE_KEY);
    localStorage.removeItem(ATTEMPT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DiagnosticoPage() {
  // Screen state
  const [screen, setScreen] = useState<Screen>("welcome");

  // Test state
  const [stage, setStage] = useState<1 | 2>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isDontKnow, setIsDontKnow] = useState(false);

  // Results state
  const [r1Responses, setR1Responses] = useState<Response[]>([]);
  const [stage2Responses, setStage2Responses] = useState<Response[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  // Signup state
  const [email, setEmail] = useState("");
  const [signupStatus, setSignupStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [signupError, setSignupError] = useState("");

  // Tracking state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Refs for timer callback (to avoid stale closure)
  const r1ResponsesRef = useRef(r1Responses);
  const stage2ResponsesRef = useRef(stage2Responses);
  const routeRef = useRef(route);

  useEffect(() => {
    r1ResponsesRef.current = r1Responses;
  }, [r1Responses]);

  useEffect(() => {
    stage2ResponsesRef.current = stage2Responses;
  }, [stage2Responses]);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  // Calculate results when time runs out
  const handleTimeUp = useCallback(() => {
    const allResponses = [
      ...r1ResponsesRef.current,
      ...stage2ResponsesRef.current,
    ];
    const finalRoute = routeRef.current || "B";

    const responseData = allResponses.map((r) => ({
      correct: r.isCorrect,
      difficulty: r.question.difficulty,
    }));
    const paesResult = calculatePAESScore(finalRoute, responseData);

    const axisData = allResponses.map((r) => ({
      axis: r.question.axis,
      correct: r.isCorrect,
    }));
    const axisPerf = calculateAxisPerformance(axisData);

    const skillData = allResponses.map((r) => ({
      skill: r.question.skill,
      correct: r.isCorrect,
    }));
    const skillPerf = calculateSkillPerformance(skillData);

    setResults({
      paesMin: paesResult.min,
      paesMax: paesResult.max,
      level: paesResult.level,
      axisPerformance: axisPerf,
      skillPerformance: skillPerf,
    });

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
      localStorage.setItem(ATTEMPT_STORAGE_KEY, data.attemptId);
    } catch (error) {
      console.error("Failed to start test:", error);
      // Create local fallback ID so test can proceed
      const localId = `local-${Date.now()}`;
      setAttemptId(localId);
      localStorage.setItem(ATTEMPT_STORAGE_KEY, localId);
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

    const response: Response = {
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

    // Also save response to API if we have a valid attempt
    if (attemptId && !attemptId.startsWith("local-")) {
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
      const newResponses = [...r1Responses, response];
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
      const newResponses = [...stage2Responses, response];
      setStage2Responses(newResponses);

      if (questionIndex === 7) {
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

  // Continue to stage 2
  const continueToStage2 = () => {
    setStage(2);
    setQuestionIndex(0);
    resetQuestionState();
    setScreen("question");
  };

  // Calculate and display results
  const calculateAndShowResults = async (finalStage2Responses: Response[]) => {
    const allResponses = [...r1Responses, ...finalStage2Responses];
    const finalRoute = route || "B";
    showResults(allResponses, finalRoute);

    // Complete test on API
    if (attemptId && !attemptId.startsWith("local-")) {
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
  const showResults = (allResponses: Response[], finalRoute: Route) => {
    const responseData = allResponses.map((r) => ({
      correct: r.isCorrect,
      difficulty: r.question.difficulty,
    }));
    const paesResult = calculatePAESScore(finalRoute, responseData);

    const axisData = allResponses.map((r) => ({
      axis: r.question.axis,
      correct: r.isCorrect,
    }));
    const axisPerf = calculateAxisPerformance(axisData);

    const skillData = allResponses.map((r) => ({
      skill: r.question.skill,
      correct: r.isCorrect,
    }));
    const skillPerf = calculateSkillPerformance(skillData);

    setResults({
      paesMin: paesResult.min,
      paesMax: paesResult.max,
      level: paesResult.level,
      axisPerformance: axisPerf,
      skillPerformance: skillPerf,
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setScreen("results");
  };

  // Compute atom mastery results from all responses
  const computeAtomResults = () => {
    const allResponses = [...r1Responses, ...stage2Responses];
    const atomMap = new Map<string, boolean>();

    // For each response, mark atoms based on correctness
    // Primary atoms: mastered if correct, not mastered if incorrect
    allResponses.forEach((response) => {
      // Safety check: atoms may be undefined if API didn't return them
      const atoms = response.atoms || [];
      atoms
        .filter((atom) => atom.relevance === "primary")
        .forEach((atom) => {
          // Only mark as mastered if correct; don't overwrite mastered with not mastered
          const current = atomMap.get(atom.atomId);
          if (current === undefined) {
            atomMap.set(atom.atomId, response.isCorrect);
          } else if (response.isCorrect && !current) {
            // If already marked not mastered but this response is correct, keep not mastered
            // Conservative: need to get it right to be mastered
          }
        });
    });

    return Array.from(atomMap.entries()).map(([atomId, mastered]) => ({
      atomId,
      mastered,
    }));
  };

  // Handle email signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSignupStatus("loading");
    setSignupError("");

    try {
      const atomResults = computeAtomResults();
      const storedResponses = getStoredResponses();
      const isLocalAttempt = !attemptId || attemptId.startsWith("local-");

      // Build signup payload with all available data
      const signupPayload = {
        email,
        attemptId: isLocalAttempt ? null : attemptId,
        atomResults,
        // Include diagnostic results for local attempts
        diagnosticData: isLocalAttempt
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

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background decorations */}
        <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
        <div className="fixed top-20 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        {/* Header */}
        <header className="relative z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            {/* Mobile: Logo + Timer row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Image src="/logo-arbor.svg" alt="Arbor" width={28} height={28} className="sm:w-8 sm:h-8" />
                <span className="font-serif font-bold text-primary hidden sm:inline">
                  Diagnóstico PAES M1
                </span>
              </div>

              {/* Progress - hidden on very small screens, shown inline on sm+ */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-sm text-cool-gray">
                  Pregunta{" "}
                  <span className="font-bold text-charcoal">
                    {currentQuestionNumber}
                  </span>
                  /{totalQuestions}
                </div>
                <div className="w-20 sm:w-28 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(currentQuestionNumber / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-mono font-medium transition-all duration-300
                ${
                  timeRemaining < 300
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : timeRemaining < 600
                      ? "bg-amber-50 text-amber-600"
                      : "bg-off-white text-charcoal shadow-sm"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${timeRemaining < 300 ? "animate-bounce-subtle" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Mobile progress bar - shown only on small screens */}
            <div className="flex sm:hidden items-center gap-3 mt-2">
              <div className="text-xs text-cool-gray">
                <span className="font-bold text-charcoal">{currentQuestionNumber}</span>/{totalQuestions}
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(currentQuestionNumber / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stage indicator */}
          <div className="bg-gradient-to-r from-off-white to-white py-1.5 sm:py-2 text-center text-xs sm:text-sm text-cool-gray border-t border-gray-50">
            <span className="font-medium">Etapa {stage} de 2</span>
            {stage === 2 && route && (
              <span className="hidden sm:inline ml-2 text-accent font-medium">
                — Preguntas adaptadas a tu nivel
              </span>
            )}
          </div>
        </header>

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
    const atomResultsForRoutes = computeAtomResults();

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
        atomResults={atomResultsForRoutes}
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
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-b from-cream to-off-white" />
        <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg w-full">
          <div className="card p-8 sm:p-12 text-center backdrop-blur-sm bg-white/90">
            {/* Logo */}
            <div className="mb-8">
              <Image
                src="/logo-arbor.svg"
                alt="Arbor"
                width={48}
                height={48}
                className="mx-auto"
              />
            </div>

            {/* Maintenance icon */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse-slow" />
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-200">
                <svg
                  className="w-12 h-12 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-3">
              Estamos en mantenimiento
            </h1>
            <p className="text-cool-gray mb-4">
              El diagnóstico no está disponible en este momento.
            </p>
            <p className="text-sm text-cool-gray mb-8 max-w-sm mx-auto">
              Nuestro equipo está trabajando para solucionarlo. Por favor,
              intenta nuevamente en unos minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-cta px-8 py-3 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reintentar
              </button>
              <Link
                href="/"
                className="btn-ghost px-8 py-3 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
