"use client";

import Link from "next/link";
import type { CompletionResponse, SprintData, SprintItem } from "./types";
import { ErrorStatePanel, ProgressRail } from "../components";

type CompletionPanelProps = {
  sprint: SprintData;
  completion: CompletionResponse;
  answeredCount: number;
  correctCount: number;
  onCreateAnother: () => void;
};

function CompletionPanel({
  sprint,
  completion,
  answeredCount,
  correctCount,
  onCreateAnother,
}: CompletionPanelProps) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
      <h2 className="text-2xl font-serif font-semibold text-primary">
        Sprint completado
      </h2>
      <p className="text-sm text-emerald-900">
        Cerraste {answeredCount}/{sprint.items.length} preguntas, con{" "}
        {correctCount} correctas.
      </p>
      <p className="text-sm text-emerald-900">
        Misión semanal: {completion.mission.completedSessions}/
        {completion.mission.targetSessions} sesiones completadas.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/portal" className="btn-primary text-sm">
          Volver al portal
        </Link>
        <button
          type="button"
          onClick={onCreateAnother}
          className="btn-ghost text-sm"
        >
          Crear otro sprint
        </button>
      </div>
    </section>
  );
}

type SprintQuestionCardProps = {
  sprint: SprintData;
  activeItem: SprintItem;
  selectedAnswer: string | null;
  latestFeedbackItemId: string | null;
  latestFeedbackIsCorrect: boolean;
  latestFeedbackAnswer: string;
  error: string | null;
  submitting: boolean;
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
  onSelectAnswer,
  onSubmit,
  onNext,
}: SprintQuestionCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-primary font-semibold">
          Item {activeItem.position} de {sprint.items.length}
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
          return (
            <button
              key={option.letter}
              type="button"
              onClick={() => onSelectAnswer(option.letter)}
              className={[
                "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                checked
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              <span className="font-semibold mr-2">{option.letter}.</span>
              {option.text}
            </button>
          );
        })}
      </div>

      {latestFeedbackItemId === activeItem.itemId ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            latestFeedbackIsCorrect
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900",
          ].join(" ")}
        >
          {latestFeedbackIsCorrect ? "Correcto." : "Respuesta incorrecta."}{" "}
          Respuesta esperada: {latestFeedbackAnswer}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !selectedAnswer}
          className="btn-primary text-sm disabled:opacity-60"
        >
          {submitting ? "Guardando..." : "Responder"}
        </button>
        <button type="button" onClick={onNext} className="btn-ghost text-sm">
          Siguiente
        </button>
      </div>
    </section>
  );
}

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
  onSelectAnswer: (answer: string) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onCompleteSprint: () => void;
  onCreateAnother: () => void;
};

export function StudySprintView(props: StudySprintViewProps) {
  if (props.loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">
          Preparando tu sprint personalizado...
        </p>
      </section>
    );
  }

  if (props.error && !props.sprint) {
    return <ErrorStatePanel message={props.error} />;
  }

  if (!props.sprint) {
    return null;
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-serif font-semibold text-primary">
              Sprint #{props.sprint.sprintId.slice(0, 8)}
            </h2>
            <p className="text-sm text-gray-600">
              Duración estimada: {props.sprint.estimatedMinutes} min
            </p>
          </div>
          <p className="text-sm text-gray-700">
            Correctas: {props.correctCount}/{props.answeredCount}
          </p>
        </div>
        <ProgressRail
          label="Progreso del sprint"
          current={props.sprint.progress.answered}
          total={props.sprint.progress.total}
        />
      </section>

      {props.activeItem ? (
        <SprintQuestionCard
          sprint={props.sprint}
          activeItem={props.activeItem}
          selectedAnswer={props.selectedAnswer}
          latestFeedbackItemId={props.latestFeedbackItemId}
          latestFeedbackIsCorrect={props.latestFeedbackIsCorrect}
          latestFeedbackAnswer={props.latestFeedbackAnswer}
          error={props.error}
          submitting={props.submitting}
          onSelectAnswer={props.onSelectAnswer}
          onSubmit={props.onSubmitAnswer}
          onNext={props.onNextQuestion}
        />
      ) : null}

      {props.isFullyAnswered ? (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <h3 className="text-lg font-serif font-semibold text-primary">
            Resumen del sprint
          </h3>
          <p className="text-sm text-gray-700">
            Respondiste {props.answeredCount} preguntas y acertaste{" "}
            {props.correctCount}.
          </p>
          <button
            type="button"
            onClick={props.onCompleteSprint}
            disabled={props.completing}
            className="btn-primary text-sm disabled:opacity-60"
          >
            {props.completing ? "Cerrando sprint..." : "Finalizar sprint"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
