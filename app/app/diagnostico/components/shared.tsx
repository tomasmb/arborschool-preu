/**
 * Shared components and icons for diagnostic screens.
 */

"use client";

import React, { useEffect, useState } from "react";

// ============================================================================
// ICONS
// ============================================================================

export const Icons = {
  star: (className: string) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  trendUp: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  target: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  book: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  unlock: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  ),
  clock: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  lightbulb: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  trophy: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  ),
  algebra: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M4 12h8m-8 5h16"
      />
    </svg>
  ),
  numbers: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
      />
    </svg>
  ),
  geometry: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  ),
  probability: (className: string) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
};

// --- Timer Warning Thresholds (seconds) ---
export const TIMER_THRESHOLDS = {
  CRITICAL: 30,
  WARNING: 300,
  CAUTION: 600,
} as const;

type TimerState = "normal" | "caution" | "warning" | "critical";

interface TimerProps {
  seconds: number;
  className?: string;
}

/**
 * Determines timer state based on remaining seconds
 */
function getTimerState(seconds: number): TimerState {
  if (seconds <= TIMER_THRESHOLDS.CRITICAL) return "critical";
  if (seconds <= TIMER_THRESHOLDS.WARNING) return "warning";
  if (seconds <= TIMER_THRESHOLDS.CAUTION) return "caution";
  return "normal";
}

/**
 * Formats seconds as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  // Style maps for each state
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

  // Accessibility: announce time changes at critical thresholds
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
      {/* Visual warning indicator for critical state */}
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
// AXIS ICON MAP
// ============================================================================

import type { Axis } from "@/lib/diagnostic/config";

export const AXIS_ICONS: Record<Axis, (className: string) => React.ReactNode> =
  {
    ALG: Icons.algebra,
    NUM: Icons.numbers,
    GEO: Icons.geometry,
    PROB: Icons.probability,
  };

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  /** Brief summary shown in header when collapsed */
  summary?: string;
  /** Help text explaining this section */
  helpText?: string;
  /** Whether section starts expanded */
  defaultExpanded?: boolean;
  /** Animation delay in ms */
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Collapsible section for organizing results.
 * Shows title + optional summary, expands to reveal full content.
 */
export function CollapsibleSection({
  title,
  summary,
  helpText,
  defaultExpanded = true,
  delay = 0,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isVisible, setIsVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {/* Section header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 mb-4 group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal text-left">
            {title}
          </h2>
          {helpText && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHelp(!showHelp);
                }}
                className="w-8 h-8 flex items-center justify-center text-cool-gray hover:text-primary rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Más información"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {showHelp && (
                <div className="absolute left-0 top-8 z-20 w-64 p-3 bg-white rounded-lg shadow-lg border text-sm text-cool-gray">
                  {helpText}
                  <div className="absolute -top-1.5 left-3 w-3 h-3 bg-white border-l border-t rotate-45" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && summary && (
            <span className="text-sm text-cool-gray hidden sm:block">
              {summary}
            </span>
          )}
          <div
            className={`p-1.5 rounded-full bg-off-white group-hover:bg-primary/10 transition-all duration-300
              ${isExpanded ? "rotate-180" : ""}`}
          >
            <svg
              className="w-5 h-5 text-cool-gray"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out
          ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

/**
 * Animated skeleton pulse bar for loading states.
 * Uses a base gray color with shimmer overlay effect.
 */
function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

/**
 * Skeleton loading state for question screen.
 * Mimics the layout of the actual question to reduce layout shift.
 */
export function QuestionSkeleton() {
  return (
    <div
      className="max-w-3xl mx-auto px-4 py-8"
      role="status"
      aria-label="Cargando pregunta"
    >
      <div className="card p-6 sm:p-10 relative overflow-hidden">
        {/* Decorative corner gradient (matches real card) */}
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full"
          aria-hidden="true"
        />

        {/* Question metadata badges skeleton */}
        <div className="flex flex-wrap items-center gap-2 mb-6 relative">
          <SkeletonBar className="w-24 h-7 rounded-lg" />
          <SkeletonBar className="w-28 h-7 rounded-lg" />
        </div>

        {/* Question content skeleton (2-3 lines of text) */}
        <div className="mb-6 sm:mb-8 space-y-3">
          <SkeletonBar className="w-full h-5" />
          <SkeletonBar className="w-5/6 h-5" />
          <SkeletonBar className="w-3/4 h-5" />
        </div>

        {/* Answer options skeleton (4 options with staggered animation) */}
        <div className="space-y-3 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Option letter circle */}
              <SkeletonBar className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0" />
              {/* Option text */}
              <div className="flex-1 space-y-2">
                <SkeletonBar className="w-full h-4" />
                <SkeletonBar className="w-2/3 h-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Skip question section skeleton - matches new separated layout */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <SkeletonBar className="w-full h-10 rounded-lg" />
        </div>

        {/* Next button skeleton */}
        <div className="mt-6 sm:mt-8 flex justify-end">
          <SkeletonBar className="w-32 h-12 rounded-xl" />
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Cargando pregunta, por favor espera...</span>
    </div>
  );
}

// ============================================================================
// OFFLINE INDICATOR
// ============================================================================

interface OfflineIndicatorProps {
  className?: string;
}

/**
 * Subtle indicator shown when operating in offline/local storage mode.
 * Non-intrusive but informative for users.
 */
export function OfflineIndicator({ className = "" }: OfflineIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Fade in after mount for smoother appearance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${className}`}
    >
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl shadow-lg">
        {/* Cloud offline icon */}
        <div className="shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364L5.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            Modo sin conexión
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Tus respuestas se guardan localmente y se sincronizarán después.
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso de modo sin conexión"
          className="shrink-0 w-8 h-8 flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded transition-colors"
        >
          <svg
            className="w-4 h-4"
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
        </button>
      </div>
    </div>
  );
}
