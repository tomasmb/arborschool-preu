"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFullTestFlow } from "./useFullTestFlow";
import { useFullTestTimer, formatTime } from "./useFullTestTimer";
import {
  ResultsScreen,
  Spinner,
  SubmittingScreen,
  TimeUpModal,
} from "./FullTestResults";
import { parseQtiXmlForReview } from "@/lib/qti/clientParser";
import { MathContent } from "@/lib/qti/MathRenderer";
import { PAES_TOTAL_QUESTIONS } from "@/lib/diagnostic/paesScoreTable";
import type { ResolvedQuestion } from "@/lib/student/fullTest";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type TestInfo = {
  testName: string | null;
  questionCount: number;
  timeLimitMinutes: number;
};

export function FullTestClient() {
  const flow = useFullTestFlow();
  const timer = useFullTestTimer({
    timeLimitMinutes: flow.timeLimitMinutes,
    onTimeUp: flow.handleTimeUp,
    enabled: flow.screen === "in-progress",
  });
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);

  useEffect(() => {
    fetch("/api/student/full-test/info", { credentials: "include" })
      .then((r) => r.json())
      .then((payload: ApiEnvelope<TestInfo>) => {
        if (payload.success) setTestInfo(payload.data);
      })
      .catch(() => {});
  }, []);

  switch (flow.screen) {
    case "pre-test":
      return (
        <PreTestScreen
          loading={flow.loading}
          error={flow.error}
          onStart={flow.startTest}
          questionCount={testInfo?.questionCount ?? PAES_TOTAL_QUESTIONS}
        />
      );
    case "in-progress":
      return <InProgressScreen flow={flow} timer={timer} />;
    case "submitting":
      return <SubmittingScreen />;
    case "time-up":
      return <TimeUpModal onSubmit={flow.submitTest} />;
    case "results":
      return flow.results ? <ResultsScreen results={flow.results} /> : null;
    default:
      return null;
  }
}

// ============================================================================
// PRE-TEST SCREEN
// ============================================================================

function PreTestScreen({
  loading,
  error,
  onStart,
  questionCount,
}: {
  loading: boolean;
  error: string | null;
  onStart: () => void;
  questionCount: number;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-off-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold text-primary">
            Test Completo PAES M1
          </h1>
          <p className="text-gray-600">
            Evalúa tu nivel con un test completo de {questionCount} preguntas
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 text-left">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Instrucciones
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="shrink-0 text-primary">•</span>
              Puedes navegar libremente entre preguntas
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-primary">•</span>
              El test se enviará automáticamente cuando se acabe el tiempo
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-primary">•</span>
              Tiempo límite: 2 horas 30 minutos
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-primary">•</span>
              {questionCount} preguntas de opción múltiple
            </li>
          </ul>
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold
            text-white shadow-sm hover:bg-primary-dark transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Preparando test...
            </span>
          ) : (
            "Comenzar Test"
          )}
        </button>

        <Link
          href="/portal"
          className="inline-block text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// IN-PROGRESS SCREEN
// ============================================================================

type InProgressProps = {
  flow: ReturnType<typeof useFullTestFlow>;
  timer: ReturnType<typeof useFullTestTimer>;
};

function InProgressScreen({ flow, timer }: InProgressProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <TimerDisplay
            timeRemaining={timer.timeRemaining}
            urgency={timer.urgency}
          />
          <div className="text-sm text-gray-500 hidden sm:block">
            {flow.testName}
          </div>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium
              text-white hover:bg-primary-dark transition-colors"
          >
            Enviar test
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 flex flex-col lg:flex-row gap-4">
        <aside className="lg:w-56 shrink-0">
          <QuestionNavigator
            totalQuestions={flow.questions.length}
            currentPosition={flow.currentPosition}
            answers={flow.answers}
            onGoTo={flow.goToQuestion}
          />
        </aside>

        <main className="flex-1 min-w-0">
          {flow.currentQuestion ? (
            <QuestionCard
              question={flow.currentQuestion}
              position={flow.currentPosition}
              totalQuestions={flow.questions.length}
              selectedAnswer={flow.answers.get(flow.currentPosition) ?? null}
              onSelectAnswer={(answer) =>
                flow.selectAnswer(flow.currentPosition, answer)
              }
            />
          ) : null}

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={flow.goPrev}
              disabled={flow.currentPosition <= 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm
                font-medium text-gray-700 hover:bg-gray-50 transition
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              {flow.answeredCount}/{flow.questions.length} respondidas
            </span>
            {flow.currentPosition >= flow.questions.length ? (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm
                  font-medium text-white hover:bg-primary-dark transition"
              >
                Enviar test
              </button>
            ) : (
              <button
                type="button"
                onClick={flow.goNext}
                className="rounded-lg bg-primary/10 px-4 py-2 text-sm
                  font-medium text-primary hover:bg-primary/20 transition"
              >
                Siguiente
              </button>
            )}
          </div>

          {flow.error ? (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              {flow.error}
            </p>
          ) : null}
        </main>
      </div>

      {showConfirm ? (
        <ConfirmDialog
          answeredCount={flow.answeredCount}
          totalQuestions={flow.questions.length}
          onConfirm={() => {
            setShowConfirm(false);
            flow.submitTest();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      ) : null}
    </div>
  );
}

// ============================================================================
// QUESTION NAVIGATOR
// ============================================================================

function QuestionNavigator({
  totalQuestions,
  currentPosition,
  answers,
  onGoTo,
}: {
  totalQuestions: number;
  currentPosition: number;
  answers: Map<number, string>;
  onGoTo: (pos: number) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium text-gray-500 mb-2">Preguntas</p>
      <div className="grid grid-cols-6 lg:grid-cols-4 gap-1.5">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const pos = i + 1;
          const isCurrent = pos === currentPosition;
          const isAnswered = answers.has(pos);

          let style = "bg-gray-100 text-gray-500";
          if (isCurrent) style = "bg-primary text-white ring-2 ring-primary/30";
          else if (isAnswered) style = "bg-emerald-100 text-emerald-700";

          return (
            <button
              key={pos}
              type="button"
              onClick={() => onGoTo(pos)}
              className={`w-full aspect-square rounded-lg text-xs font-medium
                transition-all hover:scale-105 ${style}`}
            >
              {pos}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// QUESTION CARD
// ============================================================================

function QuestionCard({
  question,
  position,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
}: {
  question: ResolvedQuestion;
  position: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
}) {
  const parsed = parseQtiXmlForReview(question.qtiXml);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-800">
        Pregunta {position} de {totalQuestions}
      </h2>

      <div className="prose prose-sm max-w-none">
        <MathContent html={parsed.html} />
      </div>

      <div className="space-y-2">
        {parsed.options.map((opt) => {
          const isSelected = selectedAnswer === opt.letter;
          return (
            <button
              key={opt.letter}
              type="button"
              onClick={() => onSelectAnswer(opt.letter)}
              className={[
                "w-full text-left rounded-xl border-2 px-4 py-3",
                "flex items-start gap-3 transition-all",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <span
                className={[
                  "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                  "text-sm font-semibold",
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {opt.letter}
              </span>
              <span className="text-sm text-gray-800 flex-1">
                <MathContent html={opt.text} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DIALOGS & SHARED
// ============================================================================

const URGENCY_STYLES: Record<string, string> = {
  normal: "text-gray-700",
  caution: "text-yellow-600",
  warning: "text-orange-600",
  critical: "text-red-600 animate-pulse",
};

function TimerDisplay({
  timeRemaining,
  urgency,
}: {
  timeRemaining: number;
  urgency: string;
}) {
  return (
    <div
      className={`font-mono text-lg font-semibold ${URGENCY_STYLES[urgency]}`}
    >
      <svg
        className="w-5 h-5 inline-block mr-1.5 -mt-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {formatTime(timeRemaining)}
    </div>
  );
}

function ConfirmDialog({
  answeredCount,
  totalQuestions,
  onConfirm,
  onCancel,
}: {
  answeredCount: number;
  totalQuestions: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const unanswered = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">¿Enviar test?</h3>
        <p className="text-sm text-gray-600">
          Has respondido {answeredCount} de {totalQuestions} preguntas.
          {unanswered > 0 ? (
            <span className="block mt-1 text-amber-600 font-medium">
              {unanswered} pregunta{unanswered !== 1 ? "s" : ""} sin responder.
            </span>
          ) : null}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5
              text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5
              text-sm font-medium text-white hover:bg-primary-dark transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
