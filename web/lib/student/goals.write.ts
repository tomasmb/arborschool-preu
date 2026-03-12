import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  careerOfferings,
  studentGoalBuffers,
  studentGoals,
  studentGoalScores,
  studentPlanningProfiles,
} from "@/db/schema";
import {
  normalizePlanningProfileInput,
  normalizeScore,
  type NormalizedPlanningProfile,
  type StudentGoalInput,
  type StudentPlanningProfileInput,
  validateGoalInputs,
} from "./goals.types";

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
    return;
  }

  await tx.insert(studentPlanningProfiles).values({ userId, ...values });
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
