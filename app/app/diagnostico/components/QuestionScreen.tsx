"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AXIS_NAMES,
  SKILL_NAMES,
  type MSTQuestion,
} from "@/lib/diagnostic/config";
import {
  parseQtiXml,
  type ParsedQuestion,
  type QuestionAtom,
} from "@/lib/diagnostic/qtiParser";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionScreenProps {
  question: MSTQuestion;
  questionIndex: number;
  selectedAnswer: string | null;
  isDontKnow: boolean;
  onSelectAnswer: (answer: string) => void;
  onSelectDontKnow: () => void;
  onNext: (correctAnswer: string | null, atoms: QuestionAtom[]) => void;
  onFatalError: () => void;
}

// ============================================================================
// OPTION BUTTON COMPONENT
// ============================================================================

function OptionButton({
  letter,
  text,
  isSelected,
  onClick,
  index,
}: {
  letter: string;
  text: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100 + index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  // Strip HTML tags for accessible label
  const plainText = text.replace(/<[^>]*>/g, "").trim();

  return (
    <button
      onClick={onClick}
      aria-label={`Opción ${letter}: ${plainText}`}
      aria-pressed={isSelected}
      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 rounded-xl border-2 transition-all duration-300
        transform ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
        ${
          isSelected
            ? "border-primary bg-primary/5 shadow-lg scale-[1.02] ring-4 ring-primary/10"
            : "border-gray-200 bg-white hover:border-primary/50 hover:bg-off-white hover:shadow-md"
        }`}
    >
      <span
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shrink-0 
          transition-all duration-300
          ${
            isSelected
              ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-md scale-110"
              : "bg-off-white text-charcoal group-hover:bg-primary/10"
          }`}
      >
        {letter}
      </span>
      <span
        className="text-left text-charcoal flex-1 text-sm sm:text-base min-w-0 break-words"
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {isSelected && (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 animate-scale-in"
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
      )}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionScreen({
  question,
  questionIndex,
  selectedAnswer,
  isDontKnow,
  onSelectAnswer,
  onSelectDontKnow,
  onNext,
  onFatalError,
}: QuestionScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [parsedQuestion, setParsedQuestion] = useState<ParsedQuestion | null>(
    null
  );
  const [isExiting, setIsExiting] = useState(false);

  const canProceed = selectedAnswer !== null || isDontKnow;
  const MAX_RETRIES = 2;

  // Fetch question content from API
  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);
      setIsExiting(false);

      try {
        const params = new URLSearchParams({
          exam: question.exam,
          questionNumber: question.questionNumber,
        });

        const response = await fetch(`/api/diagnostic/question?${params}`);
        const data = await response.json();

        if (data.success && data.question?.qtiXml) {
          const parsed = parseQtiXml(data.question.qtiXml);
          if (data.question.correctAnswer) {
            parsed.correctAnswer = data.question.correctAnswer;
          }
          parsed.atoms = data.question.atoms || [];
          setParsedQuestion(parsed);
          setError(null);
        } else {
          console.error("API error:", data.error);
          setError(data.error || "No se pudo cargar la pregunta");
          setParsedQuestion(null);
        }
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Error de conexión");
        setParsedQuestion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [question.exam, question.questionNumber, retryCount]);

  const handleNext = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNext(
        parsedQuestion?.correctAnswer || null,
        parsedQuestion?.atoms || []
      );
    }, 200);
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((prev) => prev + 1);
    } else {
      onFatalError();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6 sm:p-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center" role="status" aria-live="polite">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                aria-hidden="true"
              />
            </div>
            <p className="text-cool-gray font-medium">Cargando pregunta...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state when question fails to load
  if (error && !parsedQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-8 sm:p-12 text-center" role="alert" aria-live="polite">
          {/* Error icon */}
          <div className="relative inline-block mb-6" aria-hidden="true">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200">
              <svg
                className="w-10 h-10 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-3">
            Estamos en mantenimiento
          </h2>
          <p className="text-cool-gray mb-8 max-w-md mx-auto">
            No pudimos cargar las preguntas del diagnóstico. Estamos trabajando
            para solucionarlo lo antes posible.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {retryCount < MAX_RETRIES ? (
              <button
                onClick={handleRetry}
                aria-label="Reintentar cargar la pregunta"
                className="btn-primary px-8 py-3 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reintentar
              </button>
            ) : null}
            <Link
              href="/"
              aria-label="Volver a la página de inicio"
              className="btn-ghost px-8 py-3 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Volver al inicio
            </Link>
          </div>

          {retryCount > 0 && retryCount < MAX_RETRIES && (
            <p className="text-sm text-cool-gray mt-6">
              Intento {retryCount} de {MAX_RETRIES}
            </p>
          )}
        </div>
      </div>
    );
  }

  const options = parsedQuestion?.options || [];

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-8 transition-all duration-300
        ${isExiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}`}
    >
      <div className="card p-6 sm:p-10 relative overflow-hidden">
        {/* Decorative corner gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />

        {/* Question metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm relative">
          <span className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 text-primary rounded-lg font-medium border border-primary/10">
            {AXIS_NAMES[question.axis]}
          </span>
          <span className="px-3 py-1.5 bg-gradient-to-r from-accent/10 to-accent/5 text-accent-dark rounded-lg font-medium border border-accent/10">
            {SKILL_NAMES[question.skill]}
          </span>
        </div>

        {/* Question content */}
        <div className="prose prose-sm sm:prose-lg max-w-none mb-6 sm:mb-8">
          {parsedQuestion?.html ? (
            <div
              className="text-charcoal text-base sm:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parsedQuestion.html }}
            />
          ) : (
            <p className="text-charcoal text-base sm:text-lg leading-relaxed">
              Pregunta {questionIndex + 1}
            </p>
          )}
        </div>

        {/* Options with staggered animation */}
        <div className="space-y-3 mb-8">
          {options.map((option, index) => (
            <OptionButton
              key={option.letter}
              letter={option.letter}
              text={option.text}
              isSelected={selectedAnswer === option.letter}
              onClick={() => onSelectAnswer(option.letter)}
              index={index}
            />
          ))}
        </div>

        {/* Don't know button */}
        <button
          onClick={onSelectDontKnow}
          aria-label="Seleccionar: No lo sé"
          aria-pressed={isDontKnow}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed 
            transition-all duration-300
            ${
              isDontKnow
                ? "border-amber-500 bg-amber-50 text-amber-700 shadow-md scale-[1.01]"
                : "border-gray-300 text-cool-gray hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600"
            }`}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isDontKnow ? "rotate-12" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          No lo sé
        </button>

        {/* Next button */}
        <div className="mt-6 sm:mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            aria-label="Ir a la siguiente pregunta"
            className={`group px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300
              ${
                canProceed
                  ? "btn-primary shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            Siguiente
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${canProceed ? "group-hover:translate-x-1" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
