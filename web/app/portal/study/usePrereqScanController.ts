"use client";

import { useCallback, useEffect, useState } from "react";
import { toErrorMessage } from "../errorUtils";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";

type ScanQuestionPayload = {
  responseId: string;
  questionHtml: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
  prereqAtomId: string;
  prereqTitle: string;
  position: number;
  totalPrereqs: number;
};

type ScannedPrereq = { atomId: string; correct: boolean };

type ScanNextResult =
  | { done: false; question: ScanQuestionPayload }
  | {
      done: true;
      cooldown: boolean;
      scannedPrereqs: ScannedPrereq[];
      blockedPrereqNoQuestions?: boolean;
      blockingPrereqAtomIds?: string[];
    };

type ScanAnswerResult = {
  responseId: string;
  isCorrect: boolean;
  correctAnswer: string;
  scanComplete: boolean;
  gapFound: boolean;
  gapAtomId: string | null;
  cooldown: boolean;
  scannedPrereqs: ScannedPrereq[];
};

export type ScanPhase =
  | "loading"
  | "error"
  | "question"
  | "feedback"
  | "gap_found"
  | "all_clear"
  | "content_gap_blocked";

export function usePrereqScanController(scanSessionId: string | null) {
  const [phase, setPhase] = useState<ScanPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<ScanQuestionPayload | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<ScanAnswerResult | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [scannedPrereqs, setScannedPrereqs] = useState<ScannedPrereq[]>([]);
  const [gapAtomId, setGapAtomId] = useState<string | null>(null);
  const [blockingPrereqAtomIds, setBlockingPrereqAtomIds] = useState<
    string[] | null
  >(null);

  const fetchNext = useCallback(async (sessId: string) => {
    try {
      const res = await fetch(`/api/student/prereq-scan/${sessId}/next`, {
        credentials: "include",
      });
      const data = (await res.json()) as ApiEnvelope<ScanNextResult>;
      if (!data.success) {
        throw new Error("No pudimos cargar la siguiente pregunta");
      }

      const result = data.data;
      if (result.done) {
        setScannedPrereqs(result.scannedPrereqs);
        if (result.blockedPrereqNoQuestions) {
          setBlockingPrereqAtomIds(result.blockingPrereqAtomIds ?? []);
          setPhase("content_gap_blocked");
          return;
        }
        setBlockingPrereqAtomIds(null);
        setPhase("all_clear");
        return;
      }

      setQuestion(result.question);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setPhase("question");
    } catch (err) {
      setError(toErrorMessage(err, "Error al cargar pregunta"));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!scanSessionId) {
      setError("No se especificó la sesión de escaneo");
      setPhase("error");
      return;
    }
    fetchNext(scanSessionId);
  }, [scanSessionId, fetchNext]);

  const submitAnswer = useCallback(async () => {
    if (!scanSessionId || !question || !selectedAnswer) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/student/prereq-scan/${scanSessionId}/answer`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responseId: question.responseId,
            selectedAnswer,
          }),
        }
      );
      const data = (await res.json()) as ApiEnvelope<ScanAnswerResult>;
      if (!data.success) {
        throw new Error("No pudimos guardar tu respuesta");
      }

      const result = data.data;
      setAnswerResult(result);
      setScannedPrereqs(result.scannedPrereqs);

      if (result.gapFound) {
        setGapAtomId(result.gapAtomId);
        setPhase("gap_found");
      } else {
        setPhase("feedback");
      }
    } catch (err) {
      setError(toErrorMessage(err, "Error al enviar respuesta"));
    } finally {
      setSubmitting(false);
    }
  }, [scanSessionId, question, selectedAnswer]);

  const advanceToNext = useCallback(async () => {
    if (!scanSessionId) return;
    await fetchNext(scanSessionId);
  }, [scanSessionId, fetchNext]);

  return {
    phase,
    error,
    question,
    selectedAnswer,
    setSelectedAnswer,
    answerResult,
    submitting,
    scannedPrereqs,
    gapAtomId,
    blockingPrereqAtomIds,
    submitAnswer,
    advanceToNext,
  };
}
