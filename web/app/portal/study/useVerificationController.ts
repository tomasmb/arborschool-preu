"use client";

import { useCallback, useEffect, useState } from "react";
import { mutate } from "swr";
import { SWR_KEYS } from "@/app/portal/swrKeys";
import { toErrorMessage } from "../errorUtils";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";

type VerificationItemPayload = {
  responseId: string;
  atomId: string;
  atomTitle: string;
  questionHtml: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
};

type VerificationSessionPayload = {
  sessionId: string;
  items: VerificationItemPayload[];
};

type VerificationAnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  atomId: string;
  sessionComplete: boolean;
  prereqScan?: { sessionId: string } | null;
};

export type VerificationPhase =
  | "loading"
  | "error"
  | "empty"
  | "question"
  | "feedback"
  | "result";

type ResultSummary = {
  restored: number;
  downgraded: number;
  prereqScans: Array<{ atomId: string; scanSessionId: string }>;
};

export function useVerificationController() {
  const [phase, setPhase] = useState<VerificationPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<VerificationSessionPayload | null>(
    null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] =
    useState<VerificationAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [resultSummary, setResultSummary] = useState<ResultSummary | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const res = await fetch("/api/student/verification", {
          method: "POST",
          credentials: "include",
        });
        const data = (await res.json()) as ApiEnvelope<
          VerificationSessionPayload | { session: null; message: string }
        >;
        if (!mounted) return;

        if (!data.success) {
          throw new Error("No pudimos crear la verificación");
        }

        const payload = data.data;
        if ("session" in payload && payload.session === null) {
          setPhase("empty");
          return;
        }

        const sess = payload as VerificationSessionPayload;
        if (!sess.items || sess.items.length === 0) {
          setPhase("empty");
          return;
        }

        setSession(sess);
        setPhase("question");
      } catch (err) {
        if (!mounted) return;
        setError(toErrorMessage(err, "Error al iniciar verificación"));
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

  const prereqScans: ResultSummary["prereqScans"] = [];

  const submitAnswer = useCallback(async () => {
    if (!session || !currentItem || !selectedAnswer) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/verification", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          responseId: currentItem.responseId,
          selectedAnswer,
        }),
      });
      const data = (await res.json()) as ApiEnvelope<VerificationAnswerResult>;
      if (!data.success) {
        throw new Error("No pudimos guardar tu respuesta");
      }
      setAnswerResult(data.data);
      setAnsweredCount((c) => c + 1);
      if (data.data.isCorrect) {
        setCorrectCount((c) => c + 1);
      }
      if (data.data.prereqScan) {
        prereqScans.push({
          atomId: data.data.atomId,
          scanSessionId: data.data.prereqScan.sessionId,
        });
      }
      setPhase("feedback");
    } catch (err) {
      setError(toErrorMessage(err, "Error al enviar respuesta"));
    } finally {
      setSubmitting(false);
    }
  }, [session, currentItem, selectedAnswer, prereqScans]);

  const advanceToNext = useCallback(() => {
    if (!session) return;

    const nextIdx = currentIndex + 1;
    if (nextIdx < session.items.length) {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setPhase("question");
      return;
    }

    setResultSummary({
      restored: correctCount,
      downgraded: answeredCount - correctCount,
      prereqScans: [...prereqScans],
    });
    setPhase("result");
    void mutate(SWR_KEYS.dashboard);
    void mutate(SWR_KEYS.progress);
    void mutate(SWR_KEYS.nextAction);
  }, [session, currentIndex, correctCount, answeredCount, prereqScans]);

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
    answeredCount,
    correctCount,
    resultSummary,
    submitAnswer,
    advanceToNext,
  };
}
