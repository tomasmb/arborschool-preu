/**
 * Score History & Projection — query historical scores, build projection curves.
 *
 * Supports the progress page with historical data and future projections.
 * The projection shows uncapped growth toward the student's real goal,
 * with a confidence band that widens beyond the diagnostic ceiling.
 */

import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { testAttempts, tests } from "@/db/schema";
import {
  getPaesScore,
  estimateCorrectFromScore,
  PAES_TOTAL_QUESTIONS,
} from "@/lib/diagnostic/paesScoreTable";
import {
  MINUTES_PER_ATOM,
  IMPROVEMENT_UNCERTAINTY,
} from "@/lib/diagnostic/scoringConstants";
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
  projectedScoreMin: number;
  projectedScoreMax: number;
  beyondCeiling: boolean;
};

export type ProjectionResult = {
  points: ProjectionPoint[];
  weeksToTarget: number | null;
  targetScore: number | null;
  diagnosticCeiling: number | null;
  studyMinutesPerWeek: number;
};

type ProjectionParams = {
  userId: string;
  atomsPerWeek: number;
  targetScore?: number | null;
  /** Override starting score (e.g. personal best) instead of snapshot. */
  startingScore?: number | null;
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

const UNCERTAINTY_WITHIN_CEILING = IMPROVEMENT_UNCERTAINTY;
const UNCERTAINTY_BEYOND_CEILING = 0.22;

/**
 * Builds a projection curve showing expected score improvement over weeks.
 *
 * Algorithm:
 * 1. Start from current PAES score (diagnostic mid)
 * 2. Each week: estimate new atoms mastered → questions → score
 * 3. Apply confidence band (tighter within ceiling, wider beyond)
 * 4. Track when projection reaches the real goal target
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

  const snapshotMid = Math.round(
    (snapshot.paesScoreMin + snapshot.paesScoreMax) / 2
  );
  const currentMid = params.startingScore
    ? Math.max(params.startingScore, snapshotMid)
    : snapshotMid;
  const currentCorrect = estimateCorrectFromScore(currentMid);
  const ceiling = Math.max(snapshot.paesScoreMax, currentMid);
  const targetScore = params.targetScore ?? null;

  const { totalRelevantAtoms, masteredAtoms, totalOfficialQuestions } = metrics;
  let remaining = totalRelevantAtoms - masteredAtoms;

  const questionsPerAtom =
    totalRelevantAtoms > 0 ? totalOfficialQuestions / totalRelevantAtoms : 0;

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
    const projectedMid = getPaesScore(projectedCorrect);
    const beyondCeiling = projectedMid > ceiling;

    const uncertainty = beyondCeiling
      ? UNCERTAINTY_BEYOND_CEILING
      : UNCERTAINTY_WITHIN_CEILING;
    const band = Math.round(projectedMid * uncertainty);
    const projectedMin = Math.max(100, projectedMid - band);
    const projectedMax = Math.min(1000, projectedMid + band);

    points.push({
      week,
      projectedScoreMid: projectedMid,
      projectedScoreMin: projectedMin,
      projectedScoreMax: projectedMax,
      beyondCeiling,
    });

    if (targetScore && weeksToTarget === null && projectedMid >= targetScore) {
      weeksToTarget = week;
    }

    if (remaining <= 0) break;
  }

  return {
    points,
    weeksToTarget,
    targetScore,
    diagnosticCeiling: ceiling,
    studyMinutesPerWeek,
  };
}

function emptyProjection(studyMinutesPerWeek: number): ProjectionResult {
  return {
    points: [],
    weeksToTarget: null,
    targetScore: null,
    diagnosticCeiling: null,
    studyMinutesPerWeek,
  };
}
