import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  careerOfferings,
  careers,
  offeringCutoffs,
  offeringWeights,
  studentGoalBuffers,
  studentGoalScores,
  studentGoals,
  universities,
} from "@/db/schema";
import {
  PRIVATE_CACHE_HEADERS,
  studentApiError,
  studentApiSuccess,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";
import { normalizeWeightOrScore } from "@/lib/student/goals.types";

export type M1GoalContext = {
  hasCareerGoal: boolean;
  careerName: string | null;
  universityName: string | null;
  lastCutoff: number | null;
  bufferPoints: number;
  suggestedM1Target: number | null;
  currentM1Score: number | null;
  otherRequiredTests: string[];
};

/**
 * GET /api/student/goals/m1-context
 *
 * Returns the student's primary career offering context for the
 * post-diagnostic M1 goal confirmation screen.
 */
export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const data = await getM1GoalContext(userId);
    return studentApiSuccess(data, { headers: PRIVATE_CACHE_HEADERS });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to load M1 context";
    return studentApiError("GOALS_LOAD_FAILED", msg, 500);
  }
}

async function getM1GoalContext(userId: string): Promise<M1GoalContext> {
  const [primaryGoal] = await db
    .select({
      goalId: studentGoals.id,
      offeringId: studentGoals.offeringId,
      careerName: careers.name,
      universityName: universities.name,
      bufferPoints: studentGoalBuffers.bufferPoints,
    })
    .from(studentGoals)
    .innerJoin(careerOfferings, eq(studentGoals.offeringId, careerOfferings.id))
    .innerJoin(careers, eq(careerOfferings.careerId, careers.id))
    .innerJoin(universities, eq(careerOfferings.universityId, universities.id))
    .leftJoin(
      studentGoalBuffers,
      eq(studentGoalBuffers.goalId, studentGoals.id)
    )
    .where(
      and(eq(studentGoals.userId, userId), eq(studentGoals.isPrimary, true))
    )
    .orderBy(studentGoals.priority)
    .limit(1);

  if (!primaryGoal) {
    return {
      hasCareerGoal: false,
      careerName: null,
      universityName: null,
      lastCutoff: null,
      bufferPoints: 30,
      suggestedM1Target: null,
      currentM1Score: null,
      otherRequiredTests: [],
    };
  }

  const [cutoffRows, weights, m1ScoreRows] = await Promise.all([
    db
      .select({ cutoffScore: offeringCutoffs.cutoffScore })
      .from(offeringCutoffs)
      .where(eq(offeringCutoffs.offeringId, primaryGoal.offeringId))
      .orderBy(offeringCutoffs.admissionYear)
      .limit(1),
    db
      .select({
        testCode: offeringWeights.testCode,
        weightPercent: offeringWeights.weightPercent,
      })
      .from(offeringWeights)
      .where(eq(offeringWeights.offeringId, primaryGoal.offeringId)),
    db
      .select({ score: studentGoalScores.score })
      .from(studentGoalScores)
      .where(
        and(
          eq(studentGoalScores.goalId, primaryGoal.goalId),
          eq(studentGoalScores.testCode, "M1")
        )
      )
      .limit(1),
  ]);

  const lastCutoff = normalizeWeightOrScore(
    cutoffRows[0]?.cutoffScore ?? null
  );

  const otherRequiredTests = weights
    .filter(
      (w) =>
        w.testCode !== "M1" &&
        w.testCode !== "NEM" &&
        w.testCode !== "RANKING"
    )
    .map((w) => w.testCode);

  const currentM1Score = normalizeWeightOrScore(
    m1ScoreRows[0]?.score ?? null
  );

  const buffer = primaryGoal.bufferPoints ?? 30;
  const suggestedM1Target =
    lastCutoff !== null
      ? Math.ceil(Math.min(1000, lastCutoff + buffer))
      : null;

  return {
    hasCareerGoal: true,
    careerName: primaryGoal.careerName,
    universityName: primaryGoal.universityName,
    lastCutoff,
    bufferPoints: buffer,
    suggestedM1Target,
    currentM1Score,
    otherRequiredTests,
  };
}
