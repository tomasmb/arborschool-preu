import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  admissionsDatasets,
  careerOfferings,
  careers,
  offeringCutoffs,
  offeringWeights,
  studentGoalBuffers,
  studentGoalScores,
  studentGoals,
  studentPlanningProfiles,
  studentTestHours,
  universities,
} from "@/db/schema";
import { normalizeWeightOrScore } from "./goals.types";

type StudentGoalRow = {
  goalId: string;
  offeringId: string;
  priority: number;
  isPrimary: boolean;
  careerName: string;
  universityName: string;
  cutoffScore: string | null;
  cutoffYear: number | null;
  scoreTestCode: string | null;
  scoreValue: string | null;
  scoreSource: string | null;
  bufferPoints: number | null;
  bufferSource: string | null;
};

type AggregatedGoal = {
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
};

function reduceGoalRows(rows: StudentGoalRow[]) {
  const byGoal = new Map<string, AggregatedGoal>();

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

  return reduceGoalRows(rows);
}

export async function getStudentPlanningProfile(userId: string) {
  const rows = await db
    .select({
      examDate: studentPlanningProfiles.examDate,
      weeklyMinutesTarget: studentPlanningProfiles.weeklyMinutesTarget,
      timezone: studentPlanningProfiles.timezone,
      reminderInApp: studentPlanningProfiles.reminderInApp,
      reminderEmail: studentPlanningProfiles.reminderEmail,
      updatedAt: studentPlanningProfiles.updatedAt,
    })
    .from(studentPlanningProfiles)
    .where(eq(studentPlanningProfiles.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    examDate: row.examDate,
    weeklyMinutesTarget: row.weeklyMinutesTarget,
    timezone: row.timezone,
    reminderInApp: row.reminderInApp,
    reminderEmail: row.reminderEmail,
    updatedAt: row.updatedAt,
  };
}

/** Returns the per-test weekly minutes for a given user + test code. */
export async function getStudentTestHours(
  userId: string,
  testCode: string
): Promise<number | null> {
  const rows = await db
    .select({ weeklyMinutes: studentTestHours.weeklyMinutes })
    .from(studentTestHours)
    .where(
      and(
        eq(studentTestHours.userId, userId),
        eq(studentTestHours.testCode, testCode.trim().toUpperCase())
      )
    )
    .limit(1);

  return rows[0]?.weeklyMinutes ?? null;
}
