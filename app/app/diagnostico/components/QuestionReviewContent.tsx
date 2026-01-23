"use client";

import React from "react";
import { AXIS_NAMES, SKILL_NAMES } from "@/lib/diagnostic/config";
import type {
  ResponseForReview,
  QuestionReviewData,
  ParsedOption,
} from "./QuestionReviewDrawer";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionContentProps {
  index: number;
  response: ResponseForReview;
  reviewData: QuestionReviewData | null;
  parsedHtml: string;
  parsedOptions: ParsedOption[];
}

// ============================================================================
// HELPERS
// ============================================================================

function getOptionFeedback(
  feedbackPerOption: Record<string, string> | null,
  selectedAnswer: string | null
): string | null {
  if (!feedbackPerOption || !selectedAnswer) return null;

  const keys = [
    selectedAnswer,
    `Choice${selectedAnswer}`,
    `choice_${selectedAnswer.toLowerCase()}`,
    selectedAnswer.toLowerCase(),
  ];

  for (const key of keys) {
    if (feedbackPerOption[key]) return feedbackPerOption[key];
  }

  return null;
}

// ============================================================================
// ICONS
// ============================================================================

function CheckIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 12H4"
      />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      className="w-5 h-5 text-primary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionReviewContent({
  index,
  response,
  reviewData,
  parsedHtml,
  parsedOptions,
}: QuestionContentProps) {
  const wasSkipped = response.selectedAnswer === null;

  // Feedback
  const optionFeedback = getOptionFeedback(
    reviewData?.feedbackPerOption ?? null,
    response.selectedAnswer
  );
  const generalFeedback = reviewData?.feedbackGeneral;
  const hasFeedback = Boolean(optionFeedback || generalFeedback);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            response.isCorrect
              ? "bg-success"
              : wasSkipped
                ? "bg-gray-400"
                : "bg-error"
          } text-white`}
        >
          {response.isCorrect ? (
            <CheckIcon />
          ) : wasSkipped ? (
            <MinusIcon />
          ) : (
            <XIcon />
          )}
        </div>
        <div>
          <h3 className="text-xl font-serif font-bold text-charcoal">
            Pregunta {index + 1}
          </h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {AXIS_NAMES[response.question.axis]}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent-dark font-medium">
              {SKILL_NAMES[response.question.skill]}
            </span>
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="card p-5 sm:p-6 overflow-x-auto">
        <div
          className="prose prose-sm sm:prose max-w-none text-charcoal"
          dangerouslySetInnerHTML={{
            __html: parsedHtml || "<p>Cargando pregunta...</p>",
          }}
        />
      </div>

      {/* Answer summary */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-cool-gray">Tu respuesta:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded ${
              response.isCorrect
                ? "bg-success/10 text-success"
                : wasSkipped
                  ? "bg-gray-100 text-cool-gray"
                  : "bg-error/10 text-error"
            }`}
          >
            {wasSkipped ? "Omitida" : response.selectedAnswer}
          </span>
        </div>
        {!response.isCorrect && reviewData?.correctAnswer && (
          <div className="flex items-center gap-2">
            <span className="text-cool-gray">Correcta:</span>
            <span className="font-semibold px-2 py-0.5 rounded bg-success/10 text-success">
              {reviewData.correctAnswer}
            </span>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {parsedOptions.map((option) => {
          const isSelected = option.letter === response.selectedAnswer;
          const isCorrectOption = option.letter === reviewData?.correctAnswer;

          return (
            <div
              key={option.letter}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                isCorrectOption
                  ? "border-success bg-success/5"
                  : isSelected && !response.isCorrect
                    ? "border-error bg-error/5"
                    : "border-gray-200 bg-white"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  isCorrectOption
                    ? "bg-success text-white"
                    : isSelected && !response.isCorrect
                      ? "bg-error text-white"
                      : "bg-gray-100 text-charcoal"
                }`}
              >
                {option.letter}
              </span>
              <span
                className="flex-1 text-charcoal pt-1.5"
                dangerouslySetInnerHTML={{ __html: option.text }}
              />
              {isCorrectOption && (
                <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full shrink-0">
                  Correcta
                </span>
              )}
              {isSelected && !response.isCorrect && (
                <span className="text-xs font-semibold text-error bg-error/10 px-2.5 py-1 rounded-full shrink-0">
                  Tu respuesta
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {hasFeedback && (
        <div className="card p-5 bg-primary/5 border-primary/20 overflow-x-auto">
          <div className="flex items-center gap-2 mb-3">
            <LightbulbIcon />
            <span className="font-semibold text-charcoal">Explicación</span>
          </div>
          <div className="text-charcoal leading-relaxed">
            {optionFeedback && (
              <div dangerouslySetInnerHTML={{ __html: optionFeedback }} />
            )}
            {generalFeedback && !optionFeedback && (
              <div dangerouslySetInnerHTML={{ __html: generalFeedback }} />
            )}
          </div>
        </div>
      )}

      {!hasFeedback && (
        <div className="card p-5 bg-gray-50 border-gray-200 text-center">
          <p className="text-sm text-cool-gray">
            La explicación detallada estará disponible en tu plan de estudio
            personalizado.
          </p>
        </div>
      )}
    </div>
  );
}
