/**
 * Incremental seed-state handlers for the dev test harness.
 *
 * Each function layers specific data onto an existing user
 * to reach a particular test scenario (retest eligibility,
 * cooldown, streak, etc.).
 */

import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { RETEST_ATOM_THRESHOLD } from "@/lib/diagnostic/scoringConstants";
import {
  users,
  atomMastery,
  testAttempts,
  studentPlanningProfiles,
  studentWeeklyMissions,
  tests,
  atoms,
} from "@/db/schema";
import { getCurrentWeekRange } from "@/lib/shared/dateHelpers";

export type SeedState =
  | "mastery_atoms_18"
  | "mastery_atoms_30"
  | "full_test_completed"
  | "cooldown_atom"
  | "sr_review_due"
  | "streak_5"
  | "mission_complete"
  | "multiple_history_points"
  | "reminders_off";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function pickAtomIds(count: number): Promise<string[]> {
  const rows = await db
    .select({ id: atoms.id })
    .from(atoms)
    .orderBy(asc(atoms.id))
    .limit(count);
  return rows.map((r) => r.id);
}

async function pickDiagnosticTestId(): Promise<string | null> {
  const rows = await db
    .select({ id: tests.id })
    .from(tests)
    .where(eq(tests.testType, "diagnostic"))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function pickFullTestId(): Promise<string | null> {
  const rows = await db
    .select({ id: tests.id })
    .from(tests)
    .where(eq(tests.testType, "official"))
    .limit(1);
  if (rows[0]) return rows[0].id;

  const fallback = await db
    .select({ id: tests.id })
    .from(tests)
    .where(eq(tests.testType, "practice"))
    .limit(1);
  return fallback[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Individual seed handlers
// ---------------------------------------------------------------------------

async function seedMasteredAtoms(userId: string, count: number): Promise<void> {
  const atomIds = await pickAtomIds(count);
  const now = new Date();

  for (const atomId of atomIds) {
    await db
      .insert(atomMastery)
      .values({
        userId,
        atomId,
        status: "mastered",
        isMastered: true,
        masterySource: "study",
        firstMasteredAt: now,
        lastDemonstratedAt: now,
        currentStreak: 3,
        totalAttempts: 5,
        correctAttempts: 4,
      })
      .onConflictDoNothing();
  }
}

async function seedFullTestCompleted(userId: string): Promise<void> {
  const testId = await pickFullTestId();
  if (!testId) return;

  const now = new Date();
  await db.insert(testAttempts).values({
    userId,
    testId,
    startedAt: new Date(now.getTime() - 90 * 60 * 1000),
    completedAt: now,
    totalQuestions: 65,
    correctAnswers: 40,
    scorePercentage: "61.54",
    paesScoreMin: 650,
    paesScoreMax: 720,
  });

  await db
    .update(users)
    .set({ paesScoreMin: 650, paesScoreMax: 720, updatedAt: now })
    .where(eq(users.id, userId));
}

async function seedCooldownAtom(userId: string): Promise<void> {
  const atomIds = await pickAtomIds(1);
  if (!atomIds[0]) return;

  await db
    .insert(atomMastery)
    .values({
      userId,
      atomId: atomIds[0],
      status: "frozen",
      isMastered: false,
      cooldownUntilMasteryCount: 3,
      totalAttempts: 6,
      correctAttempts: 2,
    })
    .onConflictDoNothing();
}

async function seedSrReviewDue(userId: string): Promise<void> {
  const atomIds = await pickAtomIds(1);
  if (!atomIds[0]) return;

  const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const reviewFields = {
    status: "mastered" as const,
    isMastered: true,
    masterySource: "study" as const,
    firstMasteredAt: past,
    lastDemonstratedAt: past,
    nextReviewAt: past,
    reviewIntervalSessions: 3,
    sessionsSinceLastReview: 4,
    totalReviews: 1,
  };
  await db
    .insert(atomMastery)
    .values({ userId, atomId: atomIds[0], ...reviewFields })
    .onConflictDoUpdate({
      target: [atomMastery.userId, atomMastery.atomId],
      set: reviewFields,
    });
}

async function seedStreak(userId: string, days: number): Promise<void> {
  const today = new Date();
  await db
    .update(users)
    .set({
      currentStreak: days,
      maxStreak: days,
      lastStreakDate: today.toISOString().slice(0, 10),
      updatedAt: today,
    })
    .where(eq(users.id, userId));
}

async function seedMissionComplete(userId: string): Promise<void> {
  const { weekStartDate, weekEndDate } = getCurrentWeekRange();
  const now = new Date();

  await db
    .insert(studentWeeklyMissions)
    .values({
      userId,
      weekStartDate,
      weekEndDate,
      targetSessions: 5,
      completedSessions: 5,
      status: "completed",
      lastProgressAt: now,
    })
    .onConflictDoNothing();
}

async function seedMultipleHistoryPoints(userId: string): Promise<void> {
  const testId = await pickDiagnosticTestId();

  const now = Date.now();
  const offsets = [30, 14, 7]; // days ago

  for (const daysAgo of offsets) {
    const start = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 25 * 60 * 1000);
    const minScore = 600 + daysAgo * 2;

    await db.insert(testAttempts).values({
      userId,
      ...(testId ? { testId } : {}),
      startedAt: start,
      completedAt: end,
      totalQuestions: 16,
      correctAnswers: 8 + Math.floor(Math.random() * 4),
      scorePercentage: "55.00",
      paesScoreMin: minScore,
      paesScoreMax: minScore + 80,
    });
  }
}

async function seedRemindersOff(userId: string): Promise<void> {
  await db
    .update(studentPlanningProfiles)
    .set({
      reminderInApp: false,
      reminderEmail: false,
      updatedAt: new Date(),
    })
    .where(eq(studentPlanningProfiles.userId, userId));
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/** Apply an incremental seed state to an existing user. */
export async function applySeedState(
  userId: string,
  seed: SeedState
): Promise<void> {
  switch (seed) {
    case "mastery_atoms_18":
      await seedMasteredAtoms(userId, RETEST_ATOM_THRESHOLD);
      break;
    case "mastery_atoms_30":
      await seedMasteredAtoms(userId, 30);
      break;
    case "full_test_completed":
      await seedFullTestCompleted(userId);
      break;
    case "cooldown_atom":
      await seedCooldownAtom(userId);
      break;
    case "sr_review_due":
      await seedSrReviewDue(userId);
      break;
    case "streak_5":
      await seedStreak(userId, 5);
      break;
    case "mission_complete":
      await seedMissionComplete(userId);
      break;
    case "multiple_history_points":
      await seedMultipleHistoryPoints(userId);
      break;
    case "reminders_off":
      await seedRemindersOff(userId);
      break;
  }
}
