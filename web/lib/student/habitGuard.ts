/**
 * Habit Quality Guard — Spec Section 13.3
 *
 * Detects within-session fatigue patterns and suggests breaks or
 * switching to review. Two signals:
 *
 * 1. Consecutive failures: 3+ wrong in a row → suggest review or break
 * 2. Diminishing returns: 4-5+ atoms mastered today → suggest moderation
 */

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { atomStudySessions } from "@/db/schema";

/** Threshold: suggest intervention after N consecutive failures */
export const FAILURE_STREAK_THRESHOLD = 3;

/** Threshold: flag diminishing returns after N daily masteries */
export const DAILY_MASTERY_SOFT_CAP = 4;
export const DAILY_MASTERY_HARD_CAP = 6;

export type HabitGuardSignal = {
  /** True when consecutive failure pattern detected */
  fatigueDetected: boolean;
  /** Number of consecutive incorrect answers in current session */
  consecutiveFailures: number;
  /** Atoms mastered today across all sessions */
  dailyMasteries: number;
  /** True when daily mastery count exceeds the soft cap */
  diminishingReturns: boolean;
  /** Suggested intervention, if any */
  suggestion: HabitSuggestion | null;
};

export type HabitSuggestion = "take_break" | "switch_to_review" | "slow_down";

/**
 * Evaluates whether the student should take a break or switch modes.
 * Called after each answer to provide real-time guidance.
 */
export function evaluateSessionFatigue(
  consecutiveIncorrect: number,
  dailyMasteries: number,
  hasReviewsDue: boolean
): HabitGuardSignal {
  const fatigueDetected = consecutiveIncorrect >= FAILURE_STREAK_THRESHOLD;
  const diminishingReturns = dailyMasteries >= DAILY_MASTERY_SOFT_CAP;

  let suggestion: HabitSuggestion | null = null;

  if (fatigueDetected && hasReviewsDue) {
    suggestion = "switch_to_review";
  } else if (fatigueDetected) {
    suggestion = "take_break";
  } else if (dailyMasteries >= DAILY_MASTERY_HARD_CAP) {
    suggestion = "slow_down";
  }

  return {
    fatigueDetected,
    consecutiveFailures: consecutiveIncorrect,
    dailyMasteries,
    diminishingReturns,
    suggestion,
  };
}

/** Counts atoms the student has mastered today (since midnight local). */
export async function getDailyMasteryCount(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.sessionType, "mastery"),
        eq(atomStudySessions.status, "mastered"),
        gte(atomStudySessions.completedAt, todayStart)
      )
    );

  return Number(row?.count ?? 0);
}
