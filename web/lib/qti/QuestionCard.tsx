"use client";

import { MathContent } from "./MathRenderer";

type QuestionOption = {
  identifier: string;
  label: string;
  html: string;
};

export type QuestionCardProps = {
  questionHtml: string;
  options: QuestionOption[];
  selectedAnswer: string | null;
  onSelect: (identifier: string) => void;
  disabled?: boolean;
  difficultyBadge?: "easy" | "medium" | "hard";
  position?: number;
  totalQuestions?: number;
};

const DIFFICULTY_CFG = {
  easy: { text: "Fácil", cls: "bg-emerald-100 text-emerald-700" },
  medium: { text: "Media", cls: "bg-amber-100 text-amber-700" },
  hard: { text: "Difícil", cls: "bg-red-100 text-red-700" },
} as const;

export function QuestionCard({
  questionHtml,
  options,
  selectedAnswer,
  onSelect,
  disabled = false,
  difficultyBadge,
  position,
  totalQuestions,
}: QuestionCardProps) {
  const diff = difficultyBadge ? DIFFICULTY_CFG[difficultyBadge] : null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
      {/* Meta row: progress + difficulty */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {position != null && totalQuestions != null ? (
          <p
            className="text-xs uppercase tracking-wide
              text-gray-500 font-medium"
          >
            Pregunta {position} de {totalQuestions}
          </p>
        ) : (
          <span />
        )}

        {diff && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5
              rounded-full ${diff.cls}`}
          >
            {diff.text}
          </span>
        )}
      </div>

      {/* Question body */}
      <MathContent
        html={questionHtml}
        className="prose prose-sm max-w-none text-charcoal overflow-x-auto"
      />

      {/* Options */}
      <div className="grid gap-2">
        {options.map((opt) => {
          const checked = selectedAnswer === opt.identifier;

          return (
            <button
              key={opt.identifier}
              type="button"
              onClick={() => !disabled && onSelect(opt.identifier)}
              disabled={disabled}
              className={[
                "rounded-xl border-2 px-4 py-3 text-left text-sm",
                "transition-all duration-200 flex items-center gap-3",
                "active:scale-[0.98]",
                checked
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 hover:bg-gray-50",
                disabled ? "cursor-default" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "text-sm font-bold shrink-0 transition-colors",
                  checked
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {opt.label}
              </span>
              <MathContent html={opt.html} className="flex-1" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
