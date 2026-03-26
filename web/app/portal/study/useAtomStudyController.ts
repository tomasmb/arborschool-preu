"use client";

import { useCallback, useEffect, useState } from "react";
import { mutate } from "swr";
import { SWR_KEYS } from "@/app/portal/swrKeys";
import { toErrorMessage } from "../errorUtils";
import type {
  AtomSessionPayload,
  NextQuestionPayload,
  AnswerResultPayload,
  SessionDifficulty,
  SessionStatus,
} from "@/lib/student/atomMasteryAlgorithm";

/**
 * State-machine phases for the atom study flow.
 * loading → lesson | question → feedback → question | result
 */
export type Phase =
  | "loading"
  | "error"
  | "access_required"
  | "lesson"
  | "question"
  | "feedback"
  | "result";

export function useAtomStudyController(atomIdFromUrl: string | null) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AtomSessionPayload | null>(null);
  const [question, setQuestion] = useState<NextQuestionPayload | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResultPayload | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  // Running stats — updated from answer results
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [difficulty, setDifficulty] = useState<SessionDifficulty>("easy");
  const [finalStatus, setFinalStatus] = useState<SessionStatus | null>(null);

  // Tracks whether the student has viewed the full explanation (forced on wrong)
  const [hasViewedExplanation, setHasViewedExplanation] = useState(false);

  async function fetchNextQuestion(sessionId: string) {
    try {
      const res = await fetch(
        `/api/student/atom-sessions/${sessionId}/next-question`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? "Error al cargar pregunta");
      }

      const q = data.data as NextQuestionPayload;
      setQuestion(q);
      setDifficulty(q.difficultyLevel);
      setTotalAnswered(q.totalQuestions);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setHasViewedExplanation(false);
      setPhase("question");
    } catch (err) {
      setError(toErrorMessage(err, "No pudimos cargar la siguiente pregunta"));
      setPhase("error");
    }
  }

  // Initialize: create or resume session
  useEffect(() => {
    if (!atomIdFromUrl) {
      setError("No se especificó un concepto para estudiar");
      setPhase("error");
      return;
    }

    let mounted = true;

    async function init() {
      try {
        const res = await fetch("/api/student/atom-sessions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ atomId: atomIdFromUrl }),
        });
        const data = await res.json();
        if (!data.success) {
          if (data.error?.code === "ACCESS_REQUIRED") {
            if (!mounted) return;
            setPhase("access_required");
            return;
          }
          throw new Error(data.error?.message ?? "Error al crear sesión");
        }
        if (!mounted) return;

        const sess = data.data as AtomSessionPayload;
        setSession(sess);

        if (sess.status === "lesson" && sess.hasLesson) {
          setPhase("lesson");
        } else if (sess.status === "mastered" || sess.status === "failed") {
          setFinalStatus(sess.status);
          setPhase("result");
        } else {
          await fetchNextQuestion(sess.sessionId);
        }
      } catch (err) {
        if (!mounted) return;
        setError(toErrorMessage(err, "No pudimos iniciar la mini-clase"));
        setPhase("error");
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [atomIdFromUrl]);

  const markLessonViewed = useCallback(async () => {
    if (!session) return;
    try {
      await fetch(
        `/api/student/atom-sessions/${session.sessionId}/lesson-viewed`,
        { method: "POST", credentials: "include" }
      );
      setSession((prev) => (prev ? { ...prev, status: "in_progress" } : null));
      await fetchNextQuestion(session.sessionId);
    } catch (err) {
      setError(toErrorMessage(err, "Error al marcar lección"));
      setPhase("error");
    }
  }, [session]);

  const submitAnswer = useCallback(async () => {
    if (!session || !question || !selectedAnswer) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/student/atom-sessions/${session.sessionId}/answer`,
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
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? "Error al enviar respuesta");
      }

      const result = data.data as AnswerResultPayload;
      setAnswerResult(result);
      setTotalAnswered(result.totalQuestions);
      setTotalCorrect(result.correctQuestions);
      setDifficulty(result.currentDifficulty);
      setHasViewedExplanation(false);
      setPhase("feedback");
    } catch (err) {
      setError(toErrorMessage(err, "No pudimos guardar tu respuesta"));
    } finally {
      setSubmitting(false);
    }
  }, [session, question, selectedAnswer]);

  const markExplanationViewed = useCallback(() => {
    setHasViewedExplanation(true);
  }, []);

  /**
   * Whether the student can advance to the next question.
   * Blocked when wrong and general feedback exists but hasn't been viewed.
   */
  const canAdvance =
    !answerResult ||
    answerResult.isCorrect ||
    hasViewedExplanation ||
    !answerResult.generalFeedbackHtml;

  const advanceAfterFeedback = useCallback(async () => {
    if (!session || !answerResult) return;

    if (
      answerResult.status === "mastered" ||
      answerResult.status === "failed"
    ) {
      setFinalStatus(answerResult.status);
      setPhase("result");
      void mutate(SWR_KEYS.dashboard);
      void mutate(SWR_KEYS.progress);
      void mutate(SWR_KEYS.nextAction);
    } else {
      await fetchNextQuestion(session.sessionId);
    }
  }, [session, answerResult]);

  return {
    phase,
    error,
    session,
    question,
    selectedAnswer,
    setSelectedAnswer,
    answerResult,
    submitting,
    totalAnswered,
    totalCorrect,
    difficulty,
    finalStatus,
    hasViewedExplanation,
    canAdvance,
    markLessonViewed,
    submitAnswer,
    advanceAfterFeedback,
    markExplanationViewed,
  };
}
