import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  careerOfferings,
  studentGoalBuffers,
  studentGoals,
  studentGoalScores,
  studentScoreTargets,
  studentProfileScores,
  studentPlanningProfiles,
  studentTestHours,
} from "@/db/schema";
import {
  normalizePlanningProfileInput,
  normalizeScore,
  type NormalizedPlanningProfile,
  type StudentGoalInput,
  type StudentPlanningProfileInput,
  validateGoalInputs,
} from "./goals.types";
import {
  SCORE_MIN,
  SCORE_MAX,
  isValidScore,
  MAX_CAREER_INTERESTS,
} from "@/lib/student/constants";

type GoalIdRow = { id: string; offeringId: string };
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function assertOfferingsExist(offeringIds: string[]) {
  const existingOfferings = await db
    .select({ id: careerOfferings.id })
    .from(careerOfferings)
    .where(inArray(careerOfferings.id, offeringIds));

  if (existingOfferings.length !== offeringIds.length) {
    throw new Error("One or more offering ids do not exist");
  }
}

async function clearExistingGoals(tx: DbTx, userId: string) {
  const existingGoals = await tx
    .select({ id: studentGoals.id })
    .from(studentGoals)
    .where(eq(studentGoals.userId, userId));

  const existingGoalIds = existingGoals.map((goal) => goal.id);
  if (existingGoalIds.length === 0) {
    return;
  }

  await tx
    .delete(studentGoalScores)
    .where(inArray(studentGoalScores.goalId, existingGoalIds));
  await tx
    .delete(studentGoalBuffers)
    .where(inArray(studentGoalBuffers.goalId, existingGoalIds));
  await tx.delete(studentGoals).where(eq(studentGoals.userId, userId));
}

async function insertGoalsAndMap(
  tx: DbTx,
  userId: string,
  goals: StudentGoalInput[]
) {
  const insertedGoals = await tx
    .insert(studentGoals)
    .values(
      goals.map((goal) => ({
        userId,
        offeringId: goal.offeringId,
        priority: goal.priority,
        isPrimary: goal.isPrimary !== false,
        updatedAt: new Date(),
      }))
    )
    .returning({ id: studentGoals.id, offeringId: studentGoals.offeringId });

  return new Map(
    insertedGoals.map((goal: GoalIdRow) => [goal.offeringId, goal.id])
  );
}

function buildScoreRows(
  goals: StudentGoalInput[],
  goalIdByOfferingId: Map<string, string>
) {
  return goals.flatMap((goal) =>
    (goal.scores ?? []).map((score) => {
      const goalId = goalIdByOfferingId.get(goal.offeringId);
      if (!goalId) {
        throw new Error("Failed to map inserted goal ids");
      }

      return {
        goalId,
        testCode: score.testCode.trim().toUpperCase(),
        score: normalizeScore(score.score),
        source: score.source ?? "student",
        updatedAt: new Date(),
      };
    })
  );
}

function buildBufferRows(
  goals: StudentGoalInput[],
  goalIdByOfferingId: Map<string, string>
) {
  return goals.map((goal) => {
    const goalId = goalIdByOfferingId.get(goal.offeringId);
    if (!goalId) {
      throw new Error("Failed to map inserted goal ids");
    }

    return {
      goalId,
      bufferPoints: goal.bufferPoints ?? 30,
      source: goal.bufferSource ?? "system",
      updatedAt: new Date(),
    };
  });
}

async function upsertPlanningProfile(
  tx: DbTx,
  userId: string,
  planningProfile: NormalizedPlanningProfile | null
) {
  if (!planningProfile) {
    return;
  }

  const existingProfile = await tx
    .select({ id: studentPlanningProfiles.id })
    .from(studentPlanningProfiles)
    .where(eq(studentPlanningProfiles.userId, userId))
    .limit(1);

  const values = {
    examDate: planningProfile.examDate,
    weeklyMinutesTarget: planningProfile.weeklyMinutesTarget,
    timezone: planningProfile.timezone,
    reminderInApp: planningProfile.reminderInApp,
    reminderEmail: planningProfile.reminderEmail,
    updatedAt: new Date(),
  };

  if (existingProfile.length > 0) {
    await tx
      .update(studentPlanningProfiles)
      .set(values)
      .where(eq(studentPlanningProfiles.userId, userId));
  } else {
    await tx.insert(studentPlanningProfiles).values({ userId, ...values });
  }

  await upsertTestHoursInTx(
    tx,
    userId,
    "M1",
    planningProfile.weeklyMinutesTarget
  );
}

async function upsertTestHoursInTx(
  tx: DbTx,
  userId: string,
  testCode: string,
  weeklyMinutes: number
) {
  const [existing] = await tx
    .select({ id: studentTestHours.id })
    .from(studentTestHours)
    .where(
      and(
        eq(studentTestHours.userId, userId),
        eq(studentTestHours.testCode, testCode)
      )
    )
    .limit(1);

  if (existing) {
    await tx
      .update(studentTestHours)
      .set({ weeklyMinutes, updatedAt: new Date() })
      .where(eq(studentTestHours.id, existing.id));
  } else {
    await tx
      .insert(studentTestHours)
      .values({ userId, testCode, weeklyMinutes });
  }
}

export async function replaceStudentGoals(
  userId: string,
  goals: StudentGoalInput[],
  planningProfile?: StudentPlanningProfileInput
) {
  const validationError = validateGoalInputs(goals);
  if (validationError) {
    throw new Error(validationError);
  }

  await assertOfferingsExist(goals.map((goal) => goal.offeringId));
  const normalizedPlanningProfile =
    normalizePlanningProfileInput(planningProfile);

  await db.transaction(async (tx) => {
    await clearExistingGoals(tx, userId);

    const goalIdByOfferingId = await insertGoalsAndMap(tx, userId, goals);
    const scoreRows = buildScoreRows(goals, goalIdByOfferingId);
    const bufferRows = buildBufferRows(goals, goalIdByOfferingId);

    if (scoreRows.length > 0) {
      await tx.insert(studentGoalScores).values(scoreRows);
    }

    await tx.insert(studentGoalBuffers).values(bufferRows);
    await upsertPlanningProfile(tx, userId, normalizedPlanningProfile);
  });
}

/**
 * Updates a single test score on the user's primary goal.
 * Used by the dashboard inline meta editor to persist M1 target changes.
 */
export async function updatePrimaryGoalScore(
  userId: string,
  testCode: string,
  score: number
) {
  const normalized = testCode.trim().toUpperCase();
  const rounded = Math.round(score);
  const scoreStr = normalizeScore(rounded);

  const [primaryGoal] = await db
    .select({ id: studentGoals.id })
    .from(studentGoals)
    .where(
      and(eq(studentGoals.userId, userId), eq(studentGoals.isPrimary, true))
    )
    .limit(1);

  if (!primaryGoal) {
    throw new Error("No primary goal found");
  }

  const [existing] = await db
    .select({ id: studentGoalScores.id })
    .from(studentGoalScores)
    .where(
      and(
        eq(studentGoalScores.goalId, primaryGoal.id),
        eq(studentGoalScores.testCode, normalized)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(studentGoalScores)
      .set({ score: scoreStr, source: "student", updatedAt: new Date() })
      .where(eq(studentGoalScores.id, existing.id));
  } else {
    await db.insert(studentGoalScores).values({
      goalId: primaryGoal.id,
      testCode: normalized,
      score: scoreStr,
      source: "student",
      updatedAt: new Date(),
    });
  }

  return { testCode: normalized, score: rounded };
}

// ---------------------------------------------------------------------------
// STUDENT-CENTRIC SCORE TARGETS & PROFILE
// ---------------------------------------------------------------------------

export type ScoreTargetInput = {
  testCode: string;
  score: number;
};

export type ProfileScoreInput = {
  scoreType: string;
  score: number;
};

export type CareerInterestInput = {
  offeringId: string;
  priority: number;
};

function validateScoreTargetInputs(targets: ScoreTargetInput[]): string | null {
  for (const t of targets) {
    if (!t.testCode || typeof t.testCode !== "string") {
      return "Each score target requires a testCode";
    }
    if (!isValidScore(t.score)) {
      return `Scores must be between ${SCORE_MIN} and ${SCORE_MAX}`;
    }
  }
  return null;
}

function validateProfileScoreInputs(
  scores: ProfileScoreInput[]
): string | null {
  const validTypes = new Set(["NEM", "RANKING"]);
  for (const s of scores) {
    if (!validTypes.has(s.scoreType)) {
      return `Invalid profile score type: ${s.scoreType}`;
    }
    if (!isValidScore(s.score)) {
      return `Profile scores must be between ${SCORE_MIN} and ${SCORE_MAX}`;
    }
  }
  return null;
}

/**
 * Upserts a single PAES score target (e.g. from the dashboard M1 editor).
 */
export async function upsertStudentScoreTarget(
  userId: string,
  testCode: string,
  score: number
) {
  const normalized = testCode.trim().toUpperCase();
  const rounded = Math.round(score);
  if (!isValidScore(rounded)) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  const scoreStr = normalizeScore(rounded);
  const [existing] = await db
    .select({ id: studentScoreTargets.id })
    .from(studentScoreTargets)
    .where(
      and(
        eq(studentScoreTargets.userId, userId),
        eq(studentScoreTargets.testCode, normalized)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(studentScoreTargets)
      .set({ score: scoreStr, updatedAt: new Date() })
      .where(eq(studentScoreTargets.id, existing.id));
  } else {
    await db.insert(studentScoreTargets).values({
      userId,
      testCode: normalized,
      score: scoreStr,
    });
  }

  return { testCode: normalized, score: rounded };
}

/**
 * Upserts a single profile score (NEM or RANKING).
 */
export async function upsertStudentProfileScore(
  userId: string,
  scoreType: string,
  score: number
) {
  const normalized = scoreType.trim().toUpperCase();
  const validTypes = new Set(["NEM", "RANKING"]);
  if (!validTypes.has(normalized)) {
    throw new Error(`Invalid profile score type: ${normalized}`);
  }

  const rounded = Math.round(score);
  if (!isValidScore(rounded)) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  const scoreStr = normalizeScore(rounded);
  const [existing] = await db
    .select({ id: studentProfileScores.id })
    .from(studentProfileScores)
    .where(
      and(
        eq(studentProfileScores.userId, userId),
        eq(studentProfileScores.scoreType, normalized)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(studentProfileScores)
      .set({ score: scoreStr, updatedAt: new Date() })
      .where(eq(studentProfileScores.id, existing.id));
  } else {
    await db.insert(studentProfileScores).values({
      userId,
      scoreType: normalized,
      score: scoreStr,
    });
  }

  return { scoreType: normalized, score: rounded };
}

/**
 * Replaces only the student's career interests (studentGoals) without
 * touching score targets or profile scores. Used for auto-saving career
 * add/remove actions independently of the manual score save flow.
 */
export async function replaceStudentCareerInterests(
  userId: string,
  careerInterests: CareerInterestInput[]
) {
  if (careerInterests.length > MAX_CAREER_INTERESTS) {
    throw new Error(
      `Maximum ${MAX_CAREER_INTERESTS} career interests allowed`
    );
  }

  const offeringIds = careerInterests.map((i) => i.offeringId);
  if (offeringIds.length > 0) {
    await assertOfferingsExist(offeringIds);
  }

  await db.transaction(async (tx) => {
    await clearExistingGoals(tx, userId);
    if (careerInterests.length > 0) {
      await tx.insert(studentGoals).values(
        careerInterests.map((i) => ({
          userId,
          offeringId: i.offeringId,
          priority: i.priority,
          isPrimary: i.priority === 1,
          updatedAt: new Date(),
        }))
      );
    }
  });
}

/** Creates or updates the per-test weekly minutes for a student. */
export async function upsertStudentTestHours(
  userId: string,
  testCode: string,
  weeklyMinutes: number
) {
  const normalized = testCode.trim().toUpperCase();
  const clamped = Math.max(30, Math.min(600, Math.round(weeklyMinutes)));

  const [existing] = await db
    .select({ id: studentTestHours.id })
    .from(studentTestHours)
    .where(
      and(
        eq(studentTestHours.userId, userId),
        eq(studentTestHours.testCode, normalized)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(studentTestHours)
      .set({ weeklyMinutes: clamped, updatedAt: new Date() })
      .where(eq(studentTestHours.id, existing.id));
  } else {
    await db.insert(studentTestHours).values({
      userId,
      testCode: normalized,
      weeklyMinutes: clamped,
    });
  }

  return { testCode: normalized, weeklyMinutes: clamped };
}
