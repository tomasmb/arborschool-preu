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
  options: FeedbackOption[];
  generalFeedbackHtml?: string;
};

export function FeedbackCard({
  isCorrect,
  selectedAnswer,
  correctAnswer,
  options,
  generalFeedbackHtml,
}: FeedbackCardProps) {
  const [showSolution, setShowSolution] = useState(false);

  const selectedOpt = options.find((o) => o.identifier === selectedAnswer);
  const correctOpt = options.find((o) => o.identifier === correctAnswer);
  const showCorrectFeedback =
    !isCorrect &&
    correctOpt?.feedback &&
    correctOpt.identifier !== selectedOpt?.identifier;

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
            isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white",
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
        {selectedOpt?.feedback && (
          <ChoiceFeedback
            label={`Opción ${selectedOpt.label}`}
            html={selectedOpt.feedback}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        )}

        {/* Correct answer feedback (when wrong) */}
        {showCorrectFeedback && (
          <ChoiceFeedback
            label={`Respuesta correcta: ${correctOpt!.label}`}
            html={correctOpt!.feedback!}
            variant="correct"
          />
        )}

        {/* Expandable general feedback / full solution */}
        {generalFeedbackHtml && (
          <div>
            <button
              type="button"
              onClick={() => setShowSolution((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium
                text-primary hover:text-primary-light transition-colors"
            >
              <ChevronIcon open={showSolution} />
              Ver solución completa
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
                html={generalFeedbackHtml}
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

/* ── Choice-level feedback sub-card ────────────────────────────────── */

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

/* ── Inline SVG icons ──────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
