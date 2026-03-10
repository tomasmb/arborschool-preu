"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResolvedQuestion } from "@/lib/student/fullTest";
import type { Axis } from "@/lib/diagnostic/config";
import { resolveApiErrorMessage } from "@/lib/student/apiClientEnvelope";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";

// ============================================================================
// TYPES
// ============================================================================

export type FullTestScreen =
  | "pre-test"
  | "in-progress"
  | "submitting"
  | "time-up"
  | "results";

type AxisPerf = { correct: number; total: number; percentage: number };

export type FullTestResults = {
  paesScore: number;
  paesScoreMin: number;
  paesScoreMax: number;
  level: string;
  correctAnswers: number;
  totalQuestions: number;
  axisPerformance: Record<Axis, AxisPerf>;
};

export type FullTestState = {
  screen: FullTestScreen;
  attemptId: string | null;
  testName: string | null;
  timeLimitMinutes: number;
  questions: ResolvedQuestion[];
  answers: Map<number, string>;
  currentPosition: number;
  results: FullTestResults | null;
  error: string | null;
  loading: boolean;
};

type StartPayload = {
  attemptId: string;
  testName: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  questions: ResolvedQuestion[];
  resumed?: boolean;
  expired?: boolean;
};

// ============================================================================
// LOCALSTORAGE PERSISTENCE
// ============================================================================

const STORAGE_PREFIX = "arbor-full-test-";

function saveProgress(
  attemptId: string,
  answers: Map<number, string>,
  currentPosition: number
) {
  try {
    const data = {
      answers: Array.from(answers.entries()),
      currentPosition,
      savedAt: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${attemptId}`, JSON.stringify(data));
  } catch {
    /* localStorage might be full or blocked */
  }
}

function loadProgress(
  attemptId: string
): { answers: Map<number, string>; currentPosition: number } | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${attemptId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      answers: new Map(data.answers),
      currentPosition: data.currentPosition ?? 1,
    };
  } catch {
    return null;
  }
}

function clearProgress(attemptId: string) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${attemptId}`);
  } catch {
    /* noop */
  }
}

// ============================================================================
// API HELPERS
// ============================================================================

async function apiStartTest(): Promise<StartPayload> {
  const res = await fetch("/api/student/full-test/start", {
    method: "POST",
    credentials: "include",
  });
  const payload = (await res.json()) as ApiEnvelope<StartPayload>;
  if (!res.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "Error al iniciar el test")
    );
  }
  return payload.data;
}

async function apiSaveAnswer(body: {
  attemptId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  questionIndex: number;
}) {
  await fetch("/api/student/full-test/answer", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiCompleteTest(body: {
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: {
    originalQuestionId: string;
    isCorrect: boolean;
  }[];
}): Promise<FullTestResults> {
  const res = await fetch("/api/student/full-test/complete", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json()) as ApiEnvelope<FullTestResults>;
  if (!res.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "Error al completar el test")
    );
  }
  return payload.data;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFullTestFlow() {
  const [state, setState] = useState<FullTestState>({
    screen: "pre-test",
    attemptId: null,
    testName: null,
    timeLimitMinutes: 150,
    questions: [],
    answers: new Map(),
    currentPosition: 1,
    results: null,
    error: null,
    loading: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Persist on answer changes ──────────────────────────────────────
  useEffect(() => {
    if (state.attemptId && state.answers.size > 0) {
      saveProgress(state.attemptId, state.answers, state.currentPosition);
    }
  }, [state.attemptId, state.answers, state.currentPosition]);

  // ── Navigation guard (beforeunload) ────────────────────────────────
  useEffect(() => {
    if (state.screen !== "in-progress") return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.screen]);

  // ── Start test ─────────────────────────────────────────────────────
  const startTest = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiStartTest();
      const saved = loadProgress(data.attemptId);

      if (data.resumed && data.expired) {
        setState((s) => ({
          ...s,
          screen: "time-up",
          attemptId: data.attemptId,
          testName: data.testName,
          timeLimitMinutes: 0,
          questions: data.questions,
          answers: saved?.answers ?? new Map(),
          currentPosition: 1,
          loading: false,
        }));
        return;
      }

      setState((s) => ({
        ...s,
        screen: "in-progress",
        attemptId: data.attemptId,
        testName: data.testName,
        timeLimitMinutes: data.timeLimitMinutes ?? 150,
        questions: data.questions,
        answers: saved?.answers ?? new Map(),
        currentPosition: saved?.currentPosition ?? 1,
        loading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar el test";
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  // ── Select answer (saves to DB immediately) ────────────────────────
  const selectAnswer = useCallback((position: number, answer: string) => {
    setState((s) => {
      const next = new Map(s.answers);
      next.set(position, answer);
      return { ...s, answers: next };
    });

    const { attemptId, questions } = stateRef.current;
    if (!attemptId) return;

    const question = questions.find((q) => q.position === position);
    if (!question) return;

    apiSaveAnswer({
      attemptId,
      questionId: question.resolvedQuestionId,
      selectedAnswer: answer,
      isCorrect: answer === question.correctAnswer,
      questionIndex: position - 1,
    }).catch(() => {
      /* localStorage is the fallback; submit will retry */
    });
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────
  const goToQuestion = useCallback((position: number) => {
    setState((s) => ({ ...s, currentPosition: position }));
  }, []);

  const goNext = useCallback(() => {
    setState((s) => {
      const next = Math.min(s.currentPosition + 1, s.questions.length);
      return { ...s, currentPosition: next };
    });
  }, []);

  const goPrev = useCallback(() => {
    setState((s) => {
      const prev = Math.max(s.currentPosition - 1, 1);
      return { ...s, currentPosition: prev };
    });
  }, []);

  // ── Submit test ────────────────────────────────────────────────────
  const submitTest = useCallback(async () => {
    if (!state.attemptId) return;
    setState((s) => ({ ...s, screen: "submitting" }));

    try {
      const answeredQuestions = state.questions.map((q) => {
        const answer = state.answers.get(q.position);
        return {
          originalQuestionId: q.originalQuestionId,
          isCorrect: answer === q.correctAnswer,
        };
      });

      const correctCount = answeredQuestions.filter((a) => a.isCorrect).length;

      const results = await apiCompleteTest({
        attemptId: state.attemptId!,
        correctAnswers: correctCount,
        totalQuestions: state.questions.length,
        answeredQuestions,
      });

      clearProgress(state.attemptId!);

      setState((s) => ({
        ...s,
        screen: "results",
        results,
        error: null,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al enviar el test";
      setState((s) => ({
        ...s,
        screen: "in-progress",
        error: message,
      }));
    }
  }, [state.attemptId, state.questions, state.answers]);

  // ── Time up ────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    setState((s) => ({ ...s, screen: "time-up" }));
  }, []);

  // ── Derived values ─────────────────────────────────────────────────
  const currentQuestion =
    state.questions.find((q) => q.position === state.currentPosition) ?? null;

  const answeredCount = state.answers.size;

  return {
    ...state,
    currentQuestion,
    answeredCount,
    startTest,
    selectAnswer,
    goToQuestion,
    goNext,
    goPrev,
    submitTest,
    handleTimeUp,
  };
}
