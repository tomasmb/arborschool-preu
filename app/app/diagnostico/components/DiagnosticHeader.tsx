"use client";

import Image from "next/image";
import { Timer } from "./shared";
import type { Route } from "@/lib/diagnostic/config";

// ============================================================================
// TYPES
// ============================================================================

interface DiagnosticHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  stage: 1 | 2;
  route: Route | null;
}

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

function ProgressBar({ current, total, className = "" }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div
      className={`bg-gray-100 rounded-full overflow-hidden shadow-inner ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Pregunta ${current} de ${total}`}
    >
      <div
        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ============================================================================
// DIAGNOSTIC HEADER
// ============================================================================

/**
 * Header component for the diagnostic test question screen.
 * Shows logo, progress, timer, and stage indicator.
 * Responsive design with different layouts for mobile/desktop.
 */
export function DiagnosticHeader({
  currentQuestion,
  totalQuestions,
  timeRemaining,
  stage,
  route,
}: DiagnosticHeaderProps) {
  return (
    <header className="relative z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {/* Desktop: Logo + Progress + Timer row */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/logo-arbor.svg"
              alt="Arbor"
              width={28}
              height={28}
              className="sm:w-8 sm:h-8"
            />
            <span className="font-serif font-bold text-primary hidden sm:inline">
              Diagnóstico PAES M1
            </span>
          </div>

          {/* Progress - hidden on mobile, shown on sm+ */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-sm text-cool-gray">
              Pregunta{" "}
              <span className="font-bold text-charcoal">{currentQuestion}</span>
              /{totalQuestions}
            </div>
            <ProgressBar
              current={currentQuestion}
              total={totalQuestions}
              className="w-20 sm:w-28 h-2.5"
            />
          </div>

          {/* Timer */}
          <Timer seconds={timeRemaining} />
        </div>

        {/* Mobile progress bar - shown only on small screens */}
        <div className="flex sm:hidden items-center gap-3 mt-2">
          <div className="text-xs text-cool-gray">
            <span className="font-bold text-charcoal">{currentQuestion}</span>/
            {totalQuestions}
          </div>
          <ProgressBar
            current={currentQuestion}
            total={totalQuestions}
            className="flex-1 h-2"
          />
        </div>
      </div>

      {/* Stage indicator */}
      <div className="bg-gradient-to-r from-off-white to-white py-1.5 sm:py-2 text-center text-xs sm:text-sm text-cool-gray border-t border-gray-50">
        <span className="font-medium">Etapa {stage} de 2</span>
        {stage === 2 && route && (
          <span className="hidden sm:inline ml-2 text-accent font-medium">
            — Preguntas adaptadas a tu nivel
          </span>
        )}
      </div>
    </header>
  );
}
