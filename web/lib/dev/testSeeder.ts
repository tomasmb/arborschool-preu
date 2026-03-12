/**
 * Seeding logic for the dev-only test harness.
 *
 * Journey presets create a user at a specific point in the student lifecycle.
 * Seed states are in testSeedStates.ts and layer additional data onto
 * an existing user.
 *
 * All emails use @arbor.local to avoid collision with real users.
 */

import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  atomMastery,
  testAttempts,
  studentResponses,
  studentPlanningProfiles,
  studentGoals,
  studentGoalScores,
  studentGoalBuffers,
  studentStudySprints,
  studentStudySprintItems,
  studentWeeklyMissions,
  careerOfferings,
  tests,
  testQuestions,
  questions,
  atoms,
} from "@/db/schema";
import { getCurrentWeekRange } from "@/lib/shared/dateHelpers";

// Re-export seed state types and function for the route handler
export { applySeedState, type SeedState } from "./testSeedStates";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JourneyPreset =
  | "fresh"
  | "planning_done"
  | "diagnostic_done"
  | "active";

export type CreatedUser = {
  id: string;
  email: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function testEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-test-${ts}-${rand}@arbor.local`;
}

async function pickCareerOffering(): Promise<string | null> {
  const rows = await db
    .select({ id: careerOfferings.id })
    .from(careerOfferings)
    .limit(1);
  return rows[0]?.id ?? null;
}

async function pickDiagnosticTestId(): Promise<string | null> {
  const rows = await db
    .select({ id: tests.id })
    .from(tests)
    .where(eq(tests.testType, "diagnostic"))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function pickAtomIds(count: number): Promise<string[]> {
  const rows = await db
    .select({ id: atoms.id })
    .from(atoms)
    .orderBy(asc(atoms.id))
    .limit(count);
  return rows.map((r) => r.id);
}

async function pickTestQuestionIds(
  testId: string,
  count: number
): Promise<string[]> {
  const rows = await db
    .select({ questionId: testQuestions.questionId })
    .from(testQuestions)
    .where(eq(testQuestions.testId, testId))
    .orderBy(asc(testQuestions.position))
    .limit(count);
  return rows.map((r) => r.questionId);
}

// ---------------------------------------------------------------------------
// Core user creation
// ---------------------------------------------------------------------------

async function createBaseUser(
  email?: string,
  firstName = "Test",
  lastName = "Student"
): Promise<CreatedUser> {
  const finalEmail = email ?? testEmail();
  const [created] = await db
    .insert(users)
    .values({
      email: finalEmail,
      role: "student",
      firstName,
      lastName,
    })
    .returning({ id: users.id, email: users.email });
  return created;
}

// ---------------------------------------------------------------------------
// Planning profile + goal seeding
// ---------------------------------------------------------------------------

async function seedPlanningProfile(userId: string): Promise<void> {
  await db.insert(studentPlanningProfiles).values({
    userId,
    examDate: "2026-12-02",
    weeklyMinutesTarget: 360,
    timezone: "America/Santiago",
    reminderInApp: true,
    reminderEmail: true,
  });
}

async function seedGoal(userId: string): Promise<void> {
  const offeringId = await pickCareerOffering();
  if (!offeringId) return;

  const [goal] = await db
    .insert(studentGoals)
    .values({ userId, offeringId, priority: 1, isPrimary: true })
    .returning({ id: studentGoals.id });

  await db.insert(studentGoalScores).values({
    goalId: goal.id,
    testCode: "M1",
    score: "700",
    source: "student",
  });

  await db.insert(studentGoalBuffers).values({
    goalId: goal.id,
    bufferPoints: 30,
    source: "system",
  });
}

// ---------------------------------------------------------------------------
// Diagnostic seeding
// ---------------------------------------------------------------------------

async function seedCompletedDiagnostic(userId: string): Promise<void> {
  const testId = await pickDiagnosticTestId();
  if (!testId) {
    console.warn(
      "[testSeeder] No diagnostic test found in DB — seeding diagnostic " +
        "attempt without testId and setting user PAES scores directly"
    );
    const now = new Date();
    const startedAt = new Date(now.getTime() - 25 * 60 * 1000);
    await db.insert(testAttempts).values({
      userId,
      startedAt,
      completedAt: now,
      totalQuestions: 16,
      correctAnswers: 10,
      scorePercentage: "62.50",
      stage1Score: 5,
      stage2Difficulty: "medium",
      paesScoreMin: 620,
      paesScoreMax: 700,
    });
    await db
      .update(users)
      .set({
        paesScoreMin: 620,
        paesScoreMax: 700,
        performanceTier: "developing",
        updatedAt: now,
      })
      .where(eq(users.id, userId));
    return;
  }

  const now = new Date();
  const startedAt = new Date(now.getTime() - 25 * 60 * 1000);

  const [attempt] = await db
    .insert(testAttempts)
    .values({
      userId,
      testId,
      startedAt,
      completedAt: now,
      totalQuestions: 16,
      correctAnswers: 10,
      scorePercentage: "62.50",
      stage1Score: 5,
      stage2Difficulty: "medium",
      paesScoreMin: 620,
      paesScoreMax: 700,
    })
    .returning({ id: testAttempts.id });

  const questionIds = await pickTestQuestionIds(testId, 16);
  for (let i = 0; i < questionIds.length; i++) {
    const isCorrect = i < 10;
    await db.insert(studentResponses).values({
      userId,
      questionId: questionIds[i],
      testAttemptId: attempt.id,
      selectedAnswer: isCorrect ? "A" : "B",
      isCorrect,
      responseTimeSeconds: 60 + Math.floor(Math.random() * 30),
      stage: i < 8 ? 1 : 2,
      questionIndex: i,
    });
  }

  await db
    .update(users)
    .set({
      paesScoreMin: 620,
      paesScoreMax: 700,
      performanceTier: "developing",
      updatedAt: now,
    })
    .where(eq(users.id, userId));
}

// ---------------------------------------------------------------------------
// Active learning seeding (sprint + mission + mastery)
// ---------------------------------------------------------------------------

async function seedActiveLearning(userId: string): Promise<void> {
  const atomIds = await pickAtomIds(5);
  const now = new Date();

  for (const atomId of atomIds.slice(0, 3)) {
    await db.insert(atomMastery).values({
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
    });
  }

  const [sprint] = await db
    .insert(studentStudySprints)
    .values({
      userId,
      status: "completed",
      source: "next_action",
      estimatedMinutes: 25,
      startedAt: new Date(now.getTime() - 30 * 60 * 1000),
      completedAt: now,
    })
    .returning({ id: studentStudySprints.id });

  const firstQuestion = await db
    .select({ id: questions.id })
    .from(questions)
    .limit(1);

  if (firstQuestion[0] && atomIds[0]) {
    await db.insert(studentStudySprintItems).values({
      sprintId: sprint.id,
      position: 1,
      atomId: atomIds[0],
      questionId: firstQuestion[0].id,
      promptLabel: "E2E test item",
    });
  }

  const { weekStartDate, weekEndDate } = getCurrentWeekRange();
  await db.insert(studentWeeklyMissions).values({
    userId,
    weekStartDate,
    weekEndDate,
    targetSessions: 5,
    completedSessions: 3,
    status: "active",
    lastProgressAt: now,
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a user at the given journey preset.
 * Returns the created user's id and email.
 */
export async function createUserAtPreset(
  preset: JourneyPreset,
  overrides?: { email?: string; firstName?: string; lastName?: string }
): Promise<CreatedUser> {
  const user = await createBaseUser(
    overrides?.email,
    overrides?.firstName ?? "Test",
    overrides?.lastName ?? "Student"
  );

  switch (preset) {
    case "fresh":
      break;

    case "planning_done":
      await seedPlanningProfile(user.id);
      await seedGoal(user.id);
      break;

    case "diagnostic_done":
      await seedPlanningProfile(user.id);
      await seedGoal(user.id);
      await seedCompletedDiagnostic(user.id);
      break;

    case "active":
      await seedPlanningProfile(user.id);
      await seedGoal(user.id);
      await seedCompletedDiagnostic(user.id);
      await seedActiveLearning(user.id);
      break;
  }

  return user;
}
