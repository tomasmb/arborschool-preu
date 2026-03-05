"use client";

import { useState } from "react";
import { MathContent } from "./MathRenderer";

type FeedbackOption = {
  identifier: string;
  label: string;
  html: string;
  feedback?: string;
};

export type FeedbackCardProps = {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  /** Legacy: full option objects with per-option feedback */
  options?: FeedbackOption[];
  /** Direct HTML feedback for the selected choice */
  selectedFeedbackHtml?: string;
  /** Direct HTML feedback for the correct choice */
  correctFeedbackHtml?: string;
  generalFeedbackHtml?: string;
  /**
   * When true the "Siguiente" button is gated until the student
   * has opened the full explanation. Intended for wrong answers.
   */
  forceViewSolution?: boolean;
  /** Called when the student opens the full solution for the first time */
  onViewSolution?: () => void;
};

export function FeedbackCard({
  isCorrect,
  selectedAnswer,
  correctAnswer,
  options,
  selectedFeedbackHtml,
  correctFeedbackHtml,
  generalFeedbackHtml,
  forceViewSolution = false,
  onViewSolution,
}: FeedbackCardProps) {
  const [showSolution, setShowSolution] = useState(false);

  // Resolve feedback HTML: prefer direct props, fall back to options array
  const selectedOpt = options?.find((o) => o.identifier === selectedAnswer);
  const correctOpt = options?.find((o) => o.identifier === correctAnswer);
  const selFeedback = selectedFeedbackHtml ?? selectedOpt?.feedback;
  const corFeedback = correctFeedbackHtml ?? correctOpt?.feedback;
  const showCorrectFeedback =
    !isCorrect && corFeedback && selectedAnswer !== correctAnswer;

  function handleToggleSolution() {
    const willOpen = !showSolution;
    setShowSolution(willOpen);
    if (willOpen && onViewSolution) onViewSolution();
  }

  const hasGeneralFeedback = Boolean(generalFeedbackHtml);

  return (
    <div
      className={[
        "rounded-2xl border-2 overflow-hidden animate-fade-in-up",
        isCorrect
          ? "border-emerald-300 bg-emerald-50/50"
          : "border-red-300 bg-red-50/50",
      ].join(" ")}
    >
      {/* Banner */}
      <div
        className={[
          "flex items-center gap-3 px-5 py-3",
          isCorrect ? "bg-emerald-100" : "bg-red-100",
        ].join(" ")}
      >
        <span
          className={[
            "w-8 h-8 rounded-full flex items-center justify-center",
            isCorrect
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white",
          ].join(" ")}
        >
          {isCorrect ? <CheckIcon /> : <XIcon />}
        </span>
        <p
          className={[
            "font-semibold text-sm",
            isCorrect ? "text-emerald-800" : "text-red-800",
          ].join(" ")}
        >
          {isCorrect ? "¡Correcto!" : "Incorrecto"}
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Selected answer feedback */}
        {selFeedback && (
          <ChoiceFeedback
            label={
              isCorrect
                ? `Tu respuesta (${selectedAnswer})`
                : `Tu respuesta (${selectedAnswer})`
            }
            html={selFeedback}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        )}

        {/* Correct answer feedback (when wrong) */}
        {showCorrectFeedback && (
          <ChoiceFeedback
            label={`Respuesta correcta (${correctAnswer})`}
            html={corFeedback!}
            variant="correct"
          />
        )}

        {/* Expandable general feedback / full solution */}
        {hasGeneralFeedback && (
          <div>
            <button
              type="button"
              onClick={handleToggleSolution}
              className={[
                "flex items-center gap-2 text-sm font-medium",
                "transition-colors",
                forceViewSolution && !showSolution
                  ? "text-accent-dark hover:text-accent"
                  : "text-primary hover:text-primary-light",
              ].join(" ")}
            >
              <ChevronIcon open={showSolution} />
              {showSolution
                ? "Ocultar explicación"
                : "Ver explicación completa"}
              {forceViewSolution && !showSolution && (
                <span
                  className="ml-1 text-[10px] uppercase tracking-wider
                    font-bold bg-amber-200 text-amber-800
                    px-2 py-0.5 rounded-full"
                >
                  Requerido
                </span>
              )}
            </button>

            <div
              className={[
                "overflow-hidden transition-all duration-300",
                showSolution
                  ? "max-h-[2000px] opacity-100 mt-3"
                  : "max-h-0 opacity-0",
              ].join(" ")}
            >
              <MathContent
                html={generalFeedbackHtml!}
                className="prose prose-sm max-w-none text-charcoal
                  rounded-xl bg-primary/5 border border-primary/15 p-4"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -- Choice-level feedback sub-card ---------------------------------------- */

function ChoiceFeedback({
  label,
  html,
  variant,
}: {
  label: string;
  html: string;
  variant: "correct" | "incorrect";
}) {
  const colors =
    variant === "correct"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-red-50 border-red-200 text-red-800";

  return (
    <div className={`rounded-xl border p-3 ${colors}`}>
      <p className="text-xs font-semibold mb-1.5">{label}</p>
      <MathContent
        html={html}
        className="prose prose-sm max-w-none text-charcoal"
      />
    </div>
  );
}

/* -- Inline SVG icons ------------------------------------------------------ */

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
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
  );
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4"
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
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={[
        "w-4 h-4 transition-transform duration-200",
        open ? "rotate-90" : "",
      ].join(" ")}
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
  );
}
