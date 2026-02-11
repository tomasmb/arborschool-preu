"use client";

/**
 * Session persistence hook for the diagnostic flow.
 *
 * Handles restoring session from localStorage on mount and
 * auto-saving session state whenever it changes.
 */

import { useState, useEffect } from "react";
import {
  getStoredResponses,
  getStoredAttemptId,
  saveSessionState,
  getStoredSessionState,
  calculateRemainingTime,
} from "@/lib/diagnostic/storage";
import { type DiagnosticResults } from "@/lib/diagnostic/resultsCalculator";
import { type Route } from "@/lib/diagnostic/config";
import { type Screen } from "./useDiagnosticFlow";

// ============================================================================
// TYPES
// ============================================================================

/** Setters called during session restore to hydrate parent state */
interface RestoreSetters {
  setScreen: (s: Screen) => void;
  setStage: (s: 1 | 2) => void;
  setQuestionIndex: (i: number) => void;
  setRoute: (r: Route | null) => void;
  setTimerStartedAt: (t: number | null) => void;
  setTimeExpiredAt: (t: number | null) => void;
  setTimeRemaining: (t: number) => void;
  setResults: (r: DiagnosticResults | null) => void;
  setAttemptId: (id: string | null) => void;
}

/** Current state values needed for session save */
interface SessionState {
  screen: Screen;
  stage: 1 | 2;
  questionIndex: number;
  route: Route | null;
  timerStartedAt: number | null;
  timeExpiredAt: number | null;
  results: DiagnosticResults | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_TIME_SECONDS = 30 * 60;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Restores diagnostic session from localStorage on mount and
 * auto-saves session state on every relevant change.
 *
 * @returns isRestored — true once initial restore attempt is complete
 */
export function useSessionPersistence(
  setters: RestoreSetters,
  state: SessionState
): boolean {
  const [isRestored, setIsRestored] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedSession = getStoredSessionState();
    const storedAttemptId = getStoredAttemptId();

    if (storedSession && storedAttemptId) {
      setters.setAttemptId(storedAttemptId);

      if (storedSession.screen !== "welcome") {
        setters.setScreen(storedSession.screen);
        setters.setStage(storedSession.stage);
        setters.setQuestionIndex(storedSession.questionIndex);
        setters.setRoute(storedSession.route);
        setters.setTimerStartedAt(storedSession.timerStartedAt);

        if (storedSession.timeExpiredAt) {
          setters.setTimeExpiredAt(storedSession.timeExpiredAt);
          setters.setTimeRemaining(0);
        } else if (
          storedSession.screen === "question" ||
          storedSession.screen === "transition"
        ) {
          const remaining = calculateRemainingTime(
            storedSession.timerStartedAt
          );
          if (remaining <= 0) {
            const expiredAt =
              storedSession.timerStartedAt + TOTAL_TIME_SECONDS * 1000;
            setters.setTimeExpiredAt(expiredAt);
            setters.setTimeRemaining(0);
          } else {
            setters.setTimeRemaining(remaining);
          }
        }

        if (storedSession.results) {
          setters.setResults(storedSession.results as DiagnosticResults);
        }
      }
    }
    setIsRestored(true);
    // Run only on mount — setters are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save session state when it changes
  useEffect(() => {
    if (!isRestored) return;
    if (state.screen === "welcome" || state.screen === "mini-form") return;

    const storedResponses = getStoredResponses();
    const storedR1Correct = storedResponses
      .filter((r) => r.stage === 1)
      .filter((r) => r.isCorrect).length;
    const storedTotalCorrect = storedResponses.filter(
      (r) => r.isCorrect
    ).length;

    if (!state.timerStartedAt) {
      console.error("Attempting to save session but timerStartedAt is not set");
      return;
    }

    saveSessionState({
      screen: state.screen,
      stage: state.stage,
      questionIndex: state.questionIndex,
      route: state.route,
      r1Correct: storedR1Correct,
      totalCorrect: storedTotalCorrect,
      timerStartedAt: state.timerStartedAt,
      timeExpiredAt: state.timeExpiredAt,
      results: state.results
        ? {
            paesMin: state.results.paesMin,
            paesMax: state.results.paesMax,
            level: state.results.level,
            axisPerformance: state.results.axisPerformance,
          }
        : null,
    });
  }, [
    isRestored,
    state.screen,
    state.stage,
    state.questionIndex,
    state.route,
    state.timerStartedAt,
    state.timeExpiredAt,
    state.results,
  ]);

  return isRestored;
}
