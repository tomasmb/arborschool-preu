/**
 * Shared components and utilities for diagnostic screens.
 *
 * Larger components have been extracted to their own files:
 * - diagnosticIcons.tsx  → Icons, AXIS_ICONS
 * - TimeUpModal.tsx      → TimeUpModal
 * - OfflineIndicator.tsx → OfflineIndicator
 * - QuestionSkeleton.tsx → QuestionSkeleton
 */

"use client";

import { useEffect, useState } from "react";

// Re-exports for backward compatibility
export { Icons, AXIS_ICONS } from "./diagnosticIcons";
export { TimeUpModal } from "./TimeUpModal";
export { OfflineIndicator } from "./OfflineIndicator";
export { QuestionSkeleton } from "./QuestionSkeleton";

// ============================================================================
// TIMER CONSTANTS & UTILITIES
// ============================================================================

/** Timer warning thresholds in seconds */
export const TIMER_THRESHOLDS = {
  CRITICAL: 30,
  WARNING: 300,
  CAUTION: 600,
} as const;

type TimerState = "normal" | "caution" | "warning" | "critical";

/** Determines timer state based on remaining seconds */
function getTimerState(seconds: number): TimerState {
  if (seconds <= TIMER_THRESHOLDS.CRITICAL) return "critical";
  if (seconds <= TIMER_THRESHOLDS.WARNING) return "warning";
  if (seconds <= TIMER_THRESHOLDS.CAUTION) return "caution";
  return "normal";
}

/** Formats seconds as MM:SS */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// TIMER COMPONENT
// ============================================================================

interface TimerProps {
  seconds: number;
  className?: string;
}

/**
 * Timer display component with visual warning states.
 * - Critical (≤30s): Red pulsing with shake animation
 * - Warning (≤5min): Red with pulse
 * - Caution (≤10min): Amber
 * - Normal: Default styling
 */
export function Timer({ seconds, className = "" }: TimerProps) {
  const state = getTimerState(seconds);

  const stateStyles: Record<TimerState, string> = {
    critical: "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse",
    warning: "bg-red-100 text-red-600 animate-pulse",
    caution: "bg-amber-50 text-amber-600",
    normal: "bg-off-white text-charcoal shadow-sm",
  };

  const iconStyles: Record<TimerState, string> = {
    critical: "animate-bounce",
    warning: "animate-bounce-subtle",
    caution: "",
    normal: "",
  };

  const getAriaLabel = () => {
    const timeStr = formatTime(seconds);
    if (state === "critical")
      return `¡Atención! Quedan ${timeStr} - Tiempo casi agotado`;
    if (state === "warning") return `Advertencia: Quedan ${timeStr}`;
    return `Tiempo restante: ${timeStr}`;
  };

  return (
    <div
      role="timer"
      aria-live={state === "critical" ? "assertive" : "polite"}
      aria-label={getAriaLabel()}
      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full 
        text-xs sm:text-sm font-mono font-medium transition-all duration-300
        ${stateStyles[state]} ${className}`}
    >
      <svg
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconStyles[state]}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{formatTime(seconds)}</span>
      {state === "critical" && (
        <span className="sr-only">¡Tiempo casi agotado!</span>
      )}
    </div>
  );
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  delay?: number;
}

/** Animated number counter with cubic easing */
export function AnimatedCounter({
  target,
  duration = 2000,
  delay = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    let animationFrame: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, started]);

  return <span>{count}</span>;
}

// ============================================================================
// OVERTIME INDICATOR
// ============================================================================

interface OvertimeIndicatorProps {
  className?: string;
}

/**
 * Indicator shown when user continues the test after time expired.
 * Reminds them that these answers won't affect their score.
 */
export function OvertimeIndicator({ className = "" }: OvertimeIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 
                  rounded-full text-xs sm:text-sm font-medium
                  bg-amber-100 text-amber-700 border border-amber-200 ${className}`}
    >
      <svg
        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Tiempo extra</span>
      <span className="hidden sm:inline text-amber-600 font-normal">
        (sin puntaje)
      </span>
    </div>
  );
}
