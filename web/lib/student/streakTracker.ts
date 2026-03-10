/**
 * Daily streak tracker — consecutive days with ≥1 mastered atom.
 *
 * Spec ref: Section 13.1 — Habit Policy
 * - ≥1 mastered atom per day → streak increments
 * - Missed day → streak resets to 0
 * - Track current streak + max streak
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type DailyStreak = {
  currentStreak: number;
  maxStreak: number;
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Called on each mastery completion. Updates the user's daily streak:
 * - Same day → no-op (already counted today)
 * - Yesterday → extend streak by 1
 * - Older or null → reset streak to 1
 */
export async function updateDailyStreak(userId: string): Promise<DailyStreak> {
  const [user] = await db
    .select({
      currentStreak: users.currentStreak,
      maxStreak: users.maxStreak,
      lastStreakDate: users.lastStreakDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const today = todayUTC();

  if (user.lastStreakDate === today) {
    return {
      currentStreak: user.currentStreak,
      maxStreak: user.maxStreak,
    };
  }

  const yesterday = yesterdayUTC();
  const isConsecutive = user.lastStreakDate === yesterday;
  const newStreak = isConsecutive ? user.currentStreak + 1 : 1;
  const newMax = Math.max(user.maxStreak, newStreak);

  await db
    .update(users)
    .set({
      currentStreak: newStreak,
      maxStreak: newMax,
      lastStreakDate: today,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { currentStreak: newStreak, maxStreak: newMax };
}

/**
 * Reads the user's current streak state without mutation.
 * Accounts for broken streaks (if lastStreakDate is older than yesterday,
 * the effective current streak is 0).
 */
export async function getDailyStreak(userId: string): Promise<DailyStreak> {
  const [user] = await db
    .select({
      currentStreak: users.currentStreak,
      maxStreak: users.maxStreak,
      lastStreakDate: users.lastStreakDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const today = todayUTC();
  const yesterday = yesterdayUTC();
  const isActive =
    user.lastStreakDate === today || user.lastStreakDate === yesterday;

  return {
    currentStreak: isActive ? user.currentStreak : 0,
    maxStreak: user.maxStreak,
  };
}
