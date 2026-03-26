"use client";

import { useCallback, useEffect, useState } from "react";
import { mutate } from "swr";
import { SWR_KEYS } from "@/app/portal/swrKeys";
import { toErrorMessage } from "../errorUtils";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";

type ReviewItemPayload = {
  responseId: string;
  atomId: string;
  atomTitle: string;
  questionHtml: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
};

type ReviewSessionPayload = {
  sessionId: string;
  items: ReviewItemPayload[];
};

type ReviewAnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  atomId: string;
};

type ReviewCompletionPayload = {
  passed: number;
  failed: number;
  failedAtomIds: string[];
  failureResult?: {
    halvedIntervals: Array<{ atomId: string; newInterval: number }>;
    pendingScans: Array<{ atomId: string; scanSessionId: string }>;
  } | null;
};

export type ReviewPhase =
  | "loading"
  | "error"
  | "access_required"
  | "empty"
  | "question"
  | "feedback"
  | "result";

export function useReviewSessionController() {
  const [phase, setPhase] = useState<ReviewPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ReviewSessionPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<ReviewAnswerResult | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completion, setCompletion] = useState<ReviewCompletionPayload | null>(
    null
  );
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const res = await fetch("/api/student/atom-sessions/review", {
          method: "POST",
          credentials: "include",
        });
        const data = (await res.json()) as ApiEnvelope<
          ReviewSessionPayload | { session: null; message: string }
        >;
        if (!mounted) return;

        if (!data.success) {
          const err = data as { error?: { code?: string } };
          if (err.error?.code === "ACCESS_REQUIRED") {
            setPhase("access_required");
            return;
          }
          throw new Error("No pudimos crear la sesión de repaso");
        }

        const payload = data.data;
        if ("session" in payload && payload.session === null) {
          setPhase("empty");
          return;
        }

        const sess = payload as ReviewSessionPayload;
        if (!sess.items || sess.items.length === 0) {
          setPhase("empty");
          return;
        }

        setSession(sess);
        setPhase("question");
      } catch (err) {
        if (!mounted) return;
        setError(toErrorMessage(err, "Error al iniciar repaso"));
        setPhase("error");
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const currentItem = session?.items[currentIndex] ?? null;
  const totalItems = session?.items.length ?? 0;

  const submitAnswer = useCallback(async () => {
    if (!session || !currentItem || !selectedAnswer) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/atom-sessions/review", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          sessionId: session.sessionId,
          responseId: currentItem.responseId,
          selectedAnswer,
        }),
      });
      const data = (await res.json()) as ApiEnvelope<ReviewAnswerResult>;
      if (!data.success) {
        throw new Error("No pudimos guardar tu respuesta");
      }
      setAnswerResult(data.data);
      setAnsweredCount((c) => c + 1);
      if (data.data.isCorrect) setCorrectCount((c) => c + 1);
      setPhase("feedback");
    } catch (err) {
      setError(toErrorMessage(err, "Error al enviar respuesta"));
    } finally {
      setSubmitting(false);
    }
  }, [session, currentItem, selectedAnswer]);

  const advanceToNext = useCallback(async () => {
    if (!session) return;

    const nextIdx = currentIndex + 1;
    if (nextIdx < session.items.length) {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setPhase("question");
      return;
    }

    setCompleting(true);
    try {
      const res = await fetch("/api/student/atom-sessions/review", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          sessionId: session.sessionId,
        }),
      });
      const data = (await res.json()) as ApiEnvelope<ReviewCompletionPayload>;
      if (!data.success) throw new Error("Error al completar repaso");
      setCompletion(data.data);
      setPhase("result");
      void mutate(SWR_KEYS.dashboard);
      void mutate(SWR_KEYS.progress);
      void mutate(SWR_KEYS.nextAction);
    } catch (err) {
      setError(toErrorMessage(err, "Error al completar repaso"));
      setPhase("error");
    } finally {
      setCompleting(false);
    }
  }, [session, currentIndex]);

  return {
    phase,
    error,
    currentItem,
    currentIndex,
    totalItems,
    selectedAnswer,
    setSelectedAnswer,
    answerResult,
    submitting,
    completing,
    completion,
    answeredCount,
    correctCount,
    submitAnswer,
    advanceToNext,
  };
}
