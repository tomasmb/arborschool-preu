"use client";

import React, { useState } from "react";
import { AXIS_NAMES, type MSTQuestion } from "@/lib/diagnostic/config";

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedOption {
  letter: string;
  text: string;
  identifier: string;
}

export interface QuestionReviewData {
  qtiXml: string;
  correctAnswer: string | null;
  feedbackGeneral: string | null;
  feedbackPerOption: Record<string, string> | null;
}

interface QuestionReviewItemProps {
  index: number;
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
  reviewData: QuestionReviewData | null;
  parsedOptions: ParsedOption[];
  questionHtml: string;
}

// ============================================================================
// ICONS
// ============================================================================

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ className, isOpen }: { className: string; isOpen: boolean }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function MinusIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getOptionFeedback(
  feedbackPerOption: Record<string, string> | null,
  selectedAnswer: string | null
): string | null {
  if (!feedbackPerOption || !selectedAnswer) return null;

  // Try different key formats: "A", "ChoiceA", "choice_a", etc.
  const keys = [
    selectedAnswer,
    `Choice${selectedAnswer}`,
    `choice_${selectedAnswer.toLowerCase()}`,
    selectedAnswer.toLowerCase(),
  ];

  for (const key of keys) {
    if (feedbackPerOption[key]) {
      return feedbackPerOption[key];
    }
  }

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionReviewItem({
  index,
  question,
  selectedAnswer,
  isCorrect,
  reviewData,
  parsedOptions,
  questionHtml,
}: QuestionReviewItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const wasSkipped = selectedAnswer === null;

  // Determine feedback to show
  const optionFeedback = getOptionFeedback(reviewData?.feedbackPerOption ?? null, selectedAnswer);
  const generalFeedback = reviewData?.feedbackGeneral;
  const hasFeedback = Boolean(optionFeedback || generalFeedback);

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isCorrect
          ? "border-success/30 bg-success/5"
          : wasSkipped
            ? "border-gray-300 bg-gray-50"
            : "border-error/30 bg-error/5"
      }`}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-black/5 transition-colors"
      >
        {/* Status indicator */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isCorrect
              ? "bg-success text-white"
              : wasSkipped
                ? "bg-gray-400 text-white"
                : "bg-error text-white"
          }`}
        >
          {isCorrect ? (
            <CheckIcon className="w-5 h-5" />
          ) : wasSkipped ? (
            <MinusIcon className="w-5 h-5" />
          ) : (
            <XIcon className="w-5 h-5" />
          )}
        </div>

        {/* Question info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-charcoal">Pregunta {index + 1}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {AXIS_NAMES[question.axis]}
            </span>
          </div>
          <div className="text-sm text-cool-gray">
            {wasSkipped ? (
              <span>Omitida</span>
            ) : (
              <>
                Tu respuesta: <span className="font-medium">{selectedAnswer}</span>
                {!isCorrect && reviewData?.correctAnswer && (
                  <>
                    {" "}
                    <span className="text-cool-gray mx-1">|</span> Correcta:{" "}
                    <span className="font-medium text-success">{reviewData.correctAnswer}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        <ChevronIcon className="w-5 h-5 text-cool-gray shrink-0" isOpen={isExpanded} />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 animate-fade-in-up">
          {/* Question content */}
          <div className="prose prose-sm max-w-none">
            <div
              className="text-charcoal leading-relaxed"
              dangerouslySetInnerHTML={{ __html: questionHtml }}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            {parsedOptions.map((option) => {
              const isSelected = option.letter === selectedAnswer;
              const isCorrectOption = option.letter === reviewData?.correctAnswer;

              return (
                <div
                  key={option.letter}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isCorrectOption
                      ? "border-success bg-success/10"
                      : isSelected && !isCorrect
                        ? "border-error bg-error/10"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                      isCorrectOption
                        ? "bg-success text-white"
                        : isSelected && !isCorrect
                          ? "bg-error text-white"
                          : "bg-gray-100 text-charcoal"
                    }`}
                  >
                    {option.letter}
                  </span>
                  <span
                    className="flex-1 text-sm text-charcoal"
                    dangerouslySetInnerHTML={{ __html: option.text }}
                  />
                  {isCorrectOption && (
                    <span className="text-xs font-medium text-success bg-success/20 px-2 py-0.5 rounded-full">
                      Correcta
                    </span>
                  )}
                  {isSelected && !isCorrect && (
                    <span className="text-xs font-medium text-error bg-error/20 px-2 py-0.5 rounded-full">
                      Tu respuesta
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback section */}
          {hasFeedback && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
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
                <span className="font-semibold text-charcoal">Explicacion</span>
              </div>
              <div className="text-sm text-charcoal leading-relaxed space-y-2">
                {optionFeedback && (
                  <p dangerouslySetInnerHTML={{ __html: optionFeedback }} />
                )}
                {generalFeedback && !optionFeedback && (
                  <p dangerouslySetInnerHTML={{ __html: generalFeedback }} />
                )}
              </div>
            </div>
          )}

          {/* No feedback available message */}
          {!hasFeedback && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-cool-gray">
                La explicacion detallada estara disponible en tu plan de estudio personalizado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
