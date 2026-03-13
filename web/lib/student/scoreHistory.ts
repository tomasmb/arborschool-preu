/**
 * Score History & Projection — query historical scores, build projection curves.
 *
 * Supports the progress page with historical data and future projections.
 * Governance cap per spec §9.3: projection cannot exceed diagnosticPredictionMax
 * until a new full test recalibrates.
 */

import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { testAttempts, tests } from "@/db/schema";
import {
  getPaesScore,
  estimateCorrectFromScore,
  PAES_TOTAL_QUESTIONS,
} from "@/lib/diagnostic/paesScoreTable";
import { MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";
import { getStudentMetrics } from "./metricsService";
import { getUserDiagnosticSnapshot } from "./userQueries";

// ============================================================================
// TYPES
// ============================================================================

export type ScoreDataPoint = {
  date: string;
  type: "short_diagnostic" | "full_test";
  paesScoreMin: number;
  paesScoreMax: number;
  paesScoreMid: number;
  correctAnswers: number | null;
  totalQuestions: number | null;
  testName: string | null;
};

export type ProjectionPoint = {
  week: number;
  projectedScoreMid: number;
};

export type ProjectionResult = {
  points: ProjectionPoint[];
  weeksToTarget: number | null;
  targetScore: number | null;
  studyMinutesPerWeek: number;
};

type ProjectionParams = {
  userId: string;
  atomsPerWeek: number;
  maxWeeks?: number;
};

// ============================================================================
// SCORE HISTORY
// ============================================================================

/** Fetches all completed test attempts with PAES scores, ordered by date. */
export async function getScoreHistory(
  userId: string
): Promise<ScoreDataPoint[]> {
  const rows = await db
    .select({
      completedAt: testAttempts.completedAt,
      testId: testAttempts.testId,
      paesScoreMin: testAttempts.paesScoreMin,
      paesScoreMax: testAttempts.paesScoreMax,
      correctAnswers: testAttempts.correctAnswers,
      totalQuestions: testAttempts.totalQuestions,
      testName: tests.name,
    })
    .from(testAttempts)
    .leftJoin(tests, eq(tests.id, testAttempts.testId))
    .where(
      and(
        eq(testAttempts.userId, userId),
        isNotNull(testAttempts.completedAt),
        isNotNull(testAttempts.paesScoreMin)
      )
    )
    .orderBy(testAttempts.completedAt);

  return rows.map((r) => {
    const min = r.paesScoreMin!;
    const max = r.paesScoreMax!;
    return {
      date: r.completedAt!.toISOString(),
      type: r.testId ? "full_test" : "short_diagnostic",
      paesScoreMin: min,
      paesScoreMax: max,
      paesScoreMid: Math.round((min + max) / 2),
      correctAnswers: r.correctAnswers,
      totalQuestions: r.totalQuestions,
      testName: r.testName,
    };
  });
}

// ============================================================================
// PROJECTION CURVE
// ============================================================================

/**
 * Builds a projection curve showing expected score improvement over weeks.
 *
 * Algorithm:
 * 1. Get current PAES score + metrics (mastered atoms, total atoms)
 * 2. For each week, estimate new atoms mastered → additional questions → score
 * 3. Apply governance cap: projection cannot exceed current diagnosticPredictionMax
 * 4. Apply ±15% uncertainty for min/max band
 */
export async function buildProjectionCurve(
  params: ProjectionParams
): Promise<ProjectionResult> {
  const { userId, atomsPerWeek, maxWeeks = 20 } = params;
  const studyMinutesPerWeek = atomsPerWeek * MINUTES_PER_ATOM;

  const [snapshot, metrics] = await Promise.all([
    getUserDiagnosticSnapshot(userId),
    getStudentMetrics(userId),
  ]);

  if (!snapshot?.paesScoreMin || !snapshot?.paesScoreMax) {
    return emptyProjection(studyMinutesPerWeek);
  }

  const currentMid = Math.round(
    (snapshot.paesScoreMin + snapshot.paesScoreMax) / 2
  );
  const currentCorrect = estimateCorrectFromScore(currentMid);
  const ceiling = snapshot.paesScoreMax;

  const { totalRelevantAtoms, masteredAtoms, totalOfficialQuestions } = metrics;
  let remaining = totalRelevantAtoms - masteredAtoms;

  const questionsPerAtom =
    totalRelevantAtoms > 0 ? totalOfficialQuestions / totalRelevantAtoms : 0;

  const targetScore = ceiling;
  let cumulativeAdditionalCorrect = 0;
  let weeksToTarget: number | null = null;
  const points: ProjectionPoint[] = [];

  for (let week = 1; week <= maxWeeks; week++) {
    const newAtoms = Math.min(atomsPerWeek, remaining);
    remaining -= newAtoms;

    const additionalQuestions = newAtoms * questionsPerAtom;
    cumulativeAdditionalCorrect += additionalQuestions;

    const projectedCorrect = Math.min(
      PAES_TOTAL_QUESTIONS,
      currentCorrect + Math.round(cumulativeAdditionalCorrect)
    );
    let projectedMid = getPaesScore(projectedCorrect);

    // Governance cap: cannot exceed diagnostic ceiling until a new full test
    projectedMid = Math.min(projectedMid, ceiling);

    points.push({ week, projectedScoreMid: projectedMid });

    if (weeksToTarget === null && projectedMid >= targetScore) {
      weeksToTarget = week;
    }

    if (remaining <= 0) break;
  }

  return { points, weeksToTarget, targetScore, studyMinutesPerWeek };
}

function emptyProjection(studyMinutesPerWeek: number): ProjectionResult {
  return {
    points: [],
    weeksToTarget: null,
    targetScore: null,
    studyMinutesPerWeek,
  };
}
