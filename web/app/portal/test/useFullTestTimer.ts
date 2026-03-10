"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

type Urgency = "normal" | "caution" | "warning" | "critical";

export type TimerState = {
  timeRemaining: number;
  isRunning: boolean;
  urgency: Urgency;
};

type UseFullTestTimerParams = {
  timeLimitMinutes: number;
  onTimeUp: () => void;
  enabled: boolean;
};

// ============================================================================
// URGENCY THRESHOLDS (scaled for ~150 min test)
// ============================================================================

const CRITICAL_SECONDS = 60;
const WARNING_SECONDS = 600;
const CAUTION_SECONDS = 1800;

function getUrgency(seconds: number): Urgency {
  if (seconds < CRITICAL_SECONDS) return "critical";
  if (seconds < WARNING_SECONDS) return "warning";
  if (seconds < CAUTION_SECONDS) return "caution";
  return "normal";
}

// ============================================================================
// HOOK
// ============================================================================

export function useFullTestTimer({
  timeLimitMinutes,
  onTimeUp,
  enabled,
}: UseFullTestTimerParams): TimerState {
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    setTimeRemaining(timeLimitMinutes * 60);
  }, [timeLimitMinutes]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setTimeout(() => onTimeUpRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [enabled, clearTimer]);

  return {
    timeRemaining,
    isRunning: enabled && timeRemaining > 0,
    urgency: getUrgency(timeRemaining),
  };
}

// ============================================================================
// FORMAT HELPER
// ============================================================================

/** Formats seconds as HH:MM:SS */
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
