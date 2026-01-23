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
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  target: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  book: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  unlock: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  clock: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lightbulb: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  trophy: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  algebra: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h8m-8 5h16" />
    </svg>
  ),
  numbers: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  geometry: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  probability: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

// ============================================================================
// TIMER WARNING THRESHOLDS (in seconds)
// ============================================================================

export const TIMER_THRESHOLDS = {
  CRITICAL: 30, // 30 seconds - urgent warning
  WARNING: 300, // 5 minutes - warning state
  CAUTION: 600, // 10 minutes - caution state
} as const;

// ============================================================================
// TIMER COMPONENT
// ============================================================================

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
    if (state === "critical") return `¡Atención! Quedan ${timeStr} - Tiempo casi agotado`;
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

export function AnimatedCounter({ target, duration = 2000, delay = 0 }: AnimatedCounterProps) {
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

export const AXIS_ICONS: Record<Axis, (className: string) => React.ReactNode> = {
  ALG: Icons.algebra,
  NUM: Icons.numbers,
  GEO: Icons.geometry,
  PROB: Icons.probability,
};
