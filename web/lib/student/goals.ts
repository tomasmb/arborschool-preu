import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  admissionsDatasets,
  careerOfferings,
  careers,
  offeringCutoffs,
  offeringWeights,
  studentGoalBuffers,
  studentGoals,
  studentGoalScores,
  universities,
} from "@/db/schema";

export const MAX_PRIMARY_GOALS = 3;

type GoalScoreInput = {
  testCode: string;
  score: number;
  source?: "student" | "system";
};

export type StudentGoalInput = {
  offeringId: string;
  priority: number;
  isPrimary?: boolean;
  bufferPoints?: number;
  bufferSource?: "student" | "system";
  scores?: GoalScoreInput[];
};

function normalizeScore(value: number): string {
  return value.toFixed(2);
}

function normalizeWeightOrScore(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateGoalInputs(goals: StudentGoalInput[]): string | null {
  if (!Array.isArray(goals) || goals.length === 0) {
    return "At least one goal is required";
  }

  const primaryCount = goals.filter((goal) => goal.isPrimary !== false).length;
  if (primaryCount > MAX_PRIMARY_GOALS) {
    return `A maximum of ${MAX_PRIMARY_GOALS} primary goals is allowed`;
  }

  const uniqueOfferingIds = new Set(goals.map((goal) => goal.offeringId));
  if (uniqueOfferingIds.size !== goals.length) {
    return "Duplicate goal offering ids are not allowed";
  }

  for (const goal of goals) {
    if (!goal.offeringId || typeof goal.offeringId !== "string") {
      return "Each goal must include a valid offeringId";
    }

    if (!Number.isInteger(goal.priority) || goal.priority < 1) {
      return "Each goal must include a positive integer priority";
    }

    if (goal.bufferPoints !== undefined) {
      if (!Number.isInteger(goal.bufferPoints) || goal.bufferPoints < 0) {
        return "bufferPoints must be a non-negative integer";
      }
    }

    for (const score of goal.scores ?? []) {
      if (!score.testCode || typeof score.testCode !== "string") {
        return "Each score requires a testCode";
      }
      if (score.score < 100 || score.score > 1000) {
        return "Scores must be between 100 and 1000";
      }
    }
  }

  return null;
}

export async function listActiveAdmissionsDataset() {
  const rows = await db
    .select({
      id: admissionsDatasets.id,
      version: admissionsDatasets.version,
      source: admissionsDatasets.source,
      publishedAt: admissionsDatasets.publishedAt,
    })
    .from(admissionsDatasets)
    .where(eq(admissionsDatasets.isActive, true))
    .orderBy(desc(admissionsDatasets.publishedAt))
    .limit(1);

  return rows[0] ?? null;
}

export async function listAdmissionsOptions(datasetId: string) {
  const rows = await db
    .select({
      offeringId: careerOfferings.id,
      careerName: careers.name,
      universityName: universities.name,
      externalCode: careerOfferings.externalCode,
      cutoffScore: offeringCutoffs.cutoffScore,
      cutoffYear: offeringCutoffs.admissionYear,
      testCode: offeringWeights.testCode,
      weightPercent: offeringWeights.weightPercent,
    })
    .from(careerOfferings)
    .innerJoin(careers, eq(careerOfferings.careerId, careers.id))
    .innerJoin(universities, eq(careerOfferings.universityId, universities.id))
    .leftJoin(
      offeringCutoffs,
      eq(offeringCutoffs.offeringId, careerOfferings.id)
    )
    .leftJoin(
      offeringWeights,
      eq(offeringWeights.offeringId, careerOfferings.id)
    )
    .where(eq(careerOfferings.datasetId, datasetId))
    .orderBy(careers.name, universities.name);

  const byOffering = new Map<
    string,
    {
      offeringId: string;
      careerName: string;
      universityName: string;
      externalCode: string | null;
      lastCutoff: number | null;
      cutoffYear: number | null;
      weights: { testCode: string; weightPercent: number }[];
    }
  >();

  for (const row of rows) {
    const current = byOffering.get(row.offeringId) ?? {
      offeringId: row.offeringId,
      careerName: row.careerName,
      universityName: row.universityName,
      externalCode: row.externalCode,
      lastCutoff: null,
      cutoffYear: null,
      weights: [],
    };

    const cutoff = normalizeWeightOrScore(row.cutoffScore);
    if (
      cutoff !== null &&
      (current.cutoffYear === null ||
        (row.cutoffYear !== null && row.cutoffYear >= current.cutoffYear))
    ) {
      current.cutoffYear = row.cutoffYear;
      current.lastCutoff = cutoff;
    }

    const weight = normalizeWeightOrScore(row.weightPercent);
    if (row.testCode && weight !== null) {
      const alreadyExists = current.weights.some(
        (w) => w.testCode === row.testCode
      );
      if (!alreadyExists) {
        current.weights.push({ testCode: row.testCode, weightPercent: weight });
      }
    }

    byOffering.set(row.offeringId, current);
  }

  return [...byOffering.values()];
}

export async function listStudentGoals(userId: string) {
  const rows = await db
    .select({
      goalId: studentGoals.id,
      offeringId: careerOfferings.id,
      priority: studentGoals.priority,
      isPrimary: studentGoals.isPrimary,
      careerName: careers.name,
      universityName: universities.name,
      cutoffScore: offeringCutoffs.cutoffScore,
      cutoffYear: offeringCutoffs.admissionYear,
      scoreTestCode: studentGoalScores.testCode,
      scoreValue: studentGoalScores.score,
      scoreSource: studentGoalScores.source,
      bufferPoints: studentGoalBuffers.bufferPoints,
      bufferSource: studentGoalBuffers.source,
    })
    .from(studentGoals)
    .innerJoin(careerOfferings, eq(studentGoals.offeringId, careerOfferings.id))
    .innerJoin(careers, eq(careerOfferings.careerId, careers.id))
    .innerJoin(universities, eq(careerOfferings.universityId, universities.id))
    .leftJoin(
      offeringCutoffs,
      eq(offeringCutoffs.offeringId, careerOfferings.id)
    )
    .leftJoin(studentGoalScores, eq(studentGoalScores.goalId, studentGoals.id))
    .leftJoin(
      studentGoalBuffers,
      eq(studentGoalBuffers.goalId, studentGoals.id)
    )
    .where(eq(studentGoals.userId, userId))
    .orderBy(studentGoals.priority);

  const byGoal = new Map<
    string,
    {
      id: string;
      offeringId: string;
      priority: number;
      isPrimary: boolean;
      careerName: string;
      universityName: string;
      lastCutoff: number | null;
      cutoffYear: number | null;
      buffer: {
        points: number;
        source: string;
        isStudentEntered: boolean;
      };
      scores: {
        testCode: string;
        score: number;
        source: string;
        isStudentEntered: boolean;
      }[];
    }
  >();

  for (const row of rows) {
    const current = byGoal.get(row.goalId) ?? {
      id: row.goalId,
      offeringId: row.offeringId,
      priority: row.priority,
      isPrimary: row.isPrimary,
      careerName: row.careerName,
      universityName: row.universityName,
      lastCutoff: null,
      cutoffYear: null,
      buffer: {
        points: row.bufferPoints ?? 30,
        source: row.bufferSource ?? "system",
        isStudentEntered: (row.bufferSource ?? "system") === "student",
      },
      scores: [],
    };

    const cutoff = normalizeWeightOrScore(row.cutoffScore);
    if (
      cutoff !== null &&
      (current.cutoffYear === null ||
        (row.cutoffYear !== null && row.cutoffYear >= current.cutoffYear))
    ) {
      current.cutoffYear = row.cutoffYear;
      current.lastCutoff = cutoff;
    }

    if (row.scoreTestCode && row.scoreValue !== null) {
      const score = normalizeWeightOrScore(row.scoreValue);
      if (score !== null) {
        const exists = current.scores.some(
          (s) => s.testCode === row.scoreTestCode
        );
        if (!exists) {
          current.scores.push({
            testCode: row.scoreTestCode,
            score,
            source: row.scoreSource ?? "student",
            isStudentEntered: (row.scoreSource ?? "student") === "student",
          });
        }
      }
    }

    byGoal.set(row.goalId, current);
  }

  return [...byGoal.values()].sort((a, b) => a.priority - b.priority);
}

export async function replaceStudentGoals(
  userId: string,
  goals: StudentGoalInput[]
) {
  const validationError = validateGoalInputs(goals);
  if (validationError) {
    throw new Error(validationError);
  }

  const offeringIds = goals.map((goal) => goal.offeringId);
  const existingOfferings = await db
    .select({ id: careerOfferings.id })
    .from(careerOfferings)
    .where(inArray(careerOfferings.id, offeringIds));

  if (existingOfferings.length !== offeringIds.length) {
    throw new Error("One or more offering ids do not exist");
  }

  await db.transaction(async (tx) => {
    const existingGoals = await tx
      .select({ id: studentGoals.id })
      .from(studentGoals)
      .where(eq(studentGoals.userId, userId));

    const existingGoalIds = existingGoals.map((goal) => goal.id);
    if (existingGoalIds.length > 0) {
      await tx
        .delete(studentGoalScores)
        .where(inArray(studentGoalScores.goalId, existingGoalIds));
      await tx
        .delete(studentGoalBuffers)
        .where(inArray(studentGoalBuffers.goalId, existingGoalIds));
      await tx.delete(studentGoals).where(eq(studentGoals.userId, userId));
    }

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

    const goalIdByOfferingId = new Map(
      insertedGoals.map((goal) => [goal.offeringId, goal.id])
    );

    const scoreRows = goals.flatMap((goal) =>
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

    if (scoreRows.length > 0) {
      await tx.insert(studentGoalScores).values(scoreRows);
    }

    const bufferRows = goals.map((goal) => {
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

    await tx.insert(studentGoalBuffers).values(bufferRows);
  });

  return listStudentGoals(userId);
}

export async function getStudentGoalsView(userId: string) {
  const dataset = await listActiveAdmissionsDataset();
  if (!dataset) {
    return {
      dataset: null,
      options: [],
      goals: [],
    };
  }

  const [options, goals] = await Promise.all([
    listAdmissionsOptions(dataset.id),
    listStudentGoals(userId),
  ]);

  return {
    dataset: {
      id: dataset.id,
      version: dataset.version,
      source: dataset.source,
      publishedAt: dataset.publishedAt,
    },
    options,
    goals,
  };
}

export async function saveStudentGoalsView(
  userId: string,
  goals: StudentGoalInput[]
) {
  await replaceStudentGoals(userId, goals);
  return getStudentGoalsView(userId);
}
