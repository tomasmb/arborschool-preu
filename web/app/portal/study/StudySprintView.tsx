"use client";

import type { CompletionResponse, SprintData, SprintItem } from "./types";
import { CompletionPanel } from "./SprintCompletionPanel";
import { ErrorStatePanel, ProgressRail } from "../components";

/* ================================================================
   Question card with improved feedback
   ================================================================ */

type SprintQuestionCardProps = {
  sprint: SprintData;
  activeItem: SprintItem;
  selectedAnswer: string | null;
  latestFeedbackItemId: string | null;
  latestFeedbackIsCorrect: boolean;
  latestFeedbackAnswer: string;
  error: string | null;
  submitting: boolean;
  canGoNext: boolean;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  onNext: () => void;
};

function SprintQuestionCard({
  sprint,
  activeItem,
  selectedAnswer,
  latestFeedbackItemId,
  latestFeedbackIsCorrect,
  latestFeedbackAnswer,
  error,
  submitting,
  canGoNext,
  onSelectAnswer,
  onSubmit,
  onNext,
}: SprintQuestionCardProps) {
  const hasFeedback = latestFeedbackItemId === activeItem.itemId;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
          Pregunta {activeItem.position} de {sprint.items.length}
        </p>
        <h3 className="text-lg font-serif font-semibold text-primary">
          {activeItem.atomTitle}
        </h3>
      </div>

      <div
        className="prose prose-sm max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: activeItem.questionHtml }}
      />

      <div className="grid gap-2">
        {activeItem.options.map((option) => {
          const checked = selectedAnswer === option.letter;
          const isCorrectAnswer =
            hasFeedback && latestFeedbackAnswer === option.letter;
          const isWrongSelection =
            hasFeedback && checked && !latestFeedbackIsCorrect;

          let optionStyle = "border-gray-200 hover:bg-gray-50";
          let feedbackAnim = "";
          if (isCorrectAnswer && hasFeedback) {
            optionStyle = "border-emerald-300 bg-emerald-50 text-emerald-800";
            feedbackAnim = "animate-correct-pulse";
          } else if (isWrongSelection) {
            optionStyle = "border-red-300 bg-red-50 text-red-800";
            feedbackAnim = "animate-shake";
          } else if (checked) {
            optionStyle = "border-primary bg-primary/10 text-primary";
          }

          return (
            <button
              key={option.letter}
              type="button"
              onClick={() => !hasFeedback && onSelectAnswer(option.letter)}
              disabled={hasFeedback}
              className={[
                "rounded-xl border-2 px-4 py-3 text-left text-sm",
                "transition-all duration-200 flex items-center gap-3",
                "active:scale-[0.98]",
                optionStyle,
                feedbackAnim,
                hasFeedback ? "cursor-default" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "text-sm font-bold shrink-0 transition-colors",
                  checked || isCorrectAnswer
                    ? isCorrectAnswer && hasFeedback
                      ? "bg-emerald-500 text-white"
                      : isWrongSelection
                        ? "bg-red-500 text-white"
                        : "bg-primary text-white"
                    : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {isCorrectAnswer && hasFeedback ? (
                  <svg
                    className="w-4 h-4 animate-scale-in"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isWrongSelection ? (
                  <svg
                    className="w-4 h-4 animate-scale-in"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  option.letter
                )}
              </span>
              <span className="flex-1">{option.text}</span>
            </button>
          );
        })}
      </div>

      {hasFeedback ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm animate-fade-in-up",
            latestFeedbackIsCorrect
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900",
          ].join(" ")}
        >
          <p className="font-semibold">
            {latestFeedbackIsCorrect ? "Correcto" : "Incorrecto"}
          </p>
          {!latestFeedbackIsCorrect ? (
            <p className="mt-1">
              La respuesta correcta es {latestFeedbackAnswer}.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {/* Desktop: inline buttons */}
      <div className="hidden sm:flex flex-wrap gap-3">
        {!hasFeedback ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !selectedAnswer}
            className="btn-primary text-sm disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Responder"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="btn-primary text-sm disabled:opacity-60 flex items-center gap-2"
          >
            Siguiente
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile: pinned bottom button */}
      <div
        className="fixed bottom-0 inset-x-0 p-4 bg-white/90 backdrop-blur
          border-t border-gray-100 safe-area-bottom sm:hidden z-30"
      >
        {!hasFeedback ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !selectedAnswer}
            className="btn-primary w-full text-sm disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Responder"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="btn-primary w-full text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            Siguiente
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}

/* ================================================================
   Sprint loading skeleton
   ================================================================ */

function SprintSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full" />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse space-y-4">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-20 w-full bg-gray-100 rounded-lg" />
        <div className="space-y-2">
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Main sprint view
   ================================================================ */

type StudySprintViewProps = {
  loading: boolean;
  error: string | null;
  sprint: SprintData | null;
  completion: CompletionResponse | null;
  answeredCount: number;
  correctCount: number;
  activeItem: SprintItem | null;
  selectedAnswer: string | null;
  latestFeedbackItemId: string | null;
  latestFeedbackIsCorrect: boolean;
  latestFeedbackAnswer: string;
  submitting: boolean;
  completing: boolean;
  isFullyAnswered: boolean;
  canGoToNextQuestion: boolean;
  onSelectAnswer: (answer: string) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onCompleteSprint: () => void;
  onCreateAnother: () => void;
};

export function StudySprintView(props: StudySprintViewProps) {
  if (props.loading) return <SprintSkeleton />;

  if (props.error && !props.sprint) {
    return <ErrorStatePanel message={props.error} />;
  }

  if (!props.sprint) {
    return (
      <ErrorStatePanel
        message="No encontramos un sprint activo."
        retryLabel="Cargar sprint"
      />
    );
  }

  if (props.completion) {
    return (
      <CompletionPanel
        sprint={props.sprint}
        completion={props.completion}
        answeredCount={props.answeredCount}
        correctCount={props.correctCount}
        onCreateAnother={props.onCreateAnother}
      />
    );
  }

  const topicName = props.activeItem?.atomTitle ?? "Sprint de estudio";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-serif font-semibold text-primary">
              {topicName}
            </h2>
            <p className="text-xs text-gray-500">
              ~{props.sprint.estimatedMinutes} min
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-600 font-medium">
              {props.correctCount}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{props.answeredCount}</span>
            <span className="text-xs text-gray-400">correctas</span>
          </div>
        </div>
        <ProgressRail
          label="Progreso"
          current={props.sprint.progress.answered}
          total={props.sprint.progress.total}
        />
      </section>

      {props.activeItem ? (
        <div key={props.activeItem.itemId} className="animate-fade-in-up">
          <SprintQuestionCard
            sprint={props.sprint}
            activeItem={props.activeItem}
            selectedAnswer={props.selectedAnswer}
            latestFeedbackItemId={props.latestFeedbackItemId}
            latestFeedbackIsCorrect={props.latestFeedbackIsCorrect}
            latestFeedbackAnswer={props.latestFeedbackAnswer}
            error={props.error}
            submitting={props.submitting}
            canGoNext={props.canGoToNextQuestion}
            onSelectAnswer={props.onSelectAnswer}
            onSubmit={props.onSubmitAnswer}
            onNext={props.onNextQuestion}
          />
        </div>
      ) : null}

      {props.isFullyAnswered ? (
        <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3 animate-fade-in-up">
          <h3 className="text-lg font-serif font-semibold text-primary">
            Todas las preguntas respondidas
          </h3>
          <p className="text-sm text-gray-700">
            {props.correctCount} de {props.answeredCount} correctas.
          </p>
          <button
            type="button"
            onClick={props.onCompleteSprint}
            disabled={props.completing}
            className="btn-cta text-sm disabled:opacity-60"
          >
            {props.completing ? "Cerrando sprint..." : "Finalizar sprint"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
