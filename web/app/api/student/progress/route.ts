import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import {
  getScoreHistory,
  buildProjectionCurve,
} from "@/lib/student/scoreHistory";
import { getRetestStatus } from "@/lib/student/retestGating";
import { getUserDiagnosticSnapshot } from "@/lib/student/userQueries";
import {
  getMasteryStatusBreakdown,
  getAxisMasteryBreakdown,
} from "@/lib/student/metricsService";
import { getProgressTargets } from "@/lib/student/progressTargets";
import { resolveDisplayScore } from "@/lib/student/scoreDisplay";
import type { GoalMilestone } from "@/lib/student/progressTargets";
import type { ProjectionPoint } from "@/lib/student/scoreHistory";

/**
 * Computes weeksToReach for each milestone by scanning projection points.
 */
function enrichMilestonesWithWeeks(
  milestones: GoalMilestone[],
  points: ProjectionPoint[]
): Array<GoalMilestone & { weeksToReach: number | null }> {
  return milestones.map((m) => {
    const target = m.userM1Target;
    if (target === null) {
      return { ...m, weeksToReach: null };
    }
    const point = points.find((p) => p.projectedScoreMid >= target);
    return { ...m, weeksToReach: point?.week ?? null };
  });
}

/**
 * GET /api/student/progress
 *
 * Returns mastery breakdown, axis mastery, score history, projection
 * (toward real career goals), retest status, goal milestones, and
 * current scores.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

    const atomsPerWeek = Number(
      request.nextUrl.searchParams.get("atomsPerWeek") ?? 10
    );

    const [
      scoreHistory,
      retestStatus,
      snapshot,
      masteryBreakdown,
      axisMastery,
      targets,
    ] = await Promise.all([
      getScoreHistory(userId),
      getRetestStatus(userId),
      getUserDiagnosticSnapshot(userId),
      getMasteryStatusBreakdown(userId),
      getAxisMasteryBreakdown(userId),
      getProgressTargets(userId),
    ]);

    const hasSnapshot =
      snapshot?.paesScoreMin != null && snapshot?.paesScoreMax != null;

    const display = hasSnapshot
      ? resolveDisplayScore(
          {
            paesScoreMin: snapshot!.paesScoreMin!,
            paesScoreMax: snapshot!.paesScoreMax!,
          },
          scoreHistory
        )
      : null;

    const projectionTarget =
      targets.highestUserM1 ?? targets.highestTargetM1;

    const projection = await buildProjectionCurve({
      userId,
      atomsPerWeek,
      targetScore: projectionTarget,
      startingScore: display?.score ?? null,
    });

    const goalMilestones = enrichMilestonesWithWeeks(
      targets.milestones,
      projection.points
    );

    const currentScore = display
      ? {
          min: display.min,
          max: display.max,
          mid: display.score,
          isPersonalBest: display.isPersonalBest,
        }
      : null;

    const personalBest =
      scoreHistory.length > 0
        ? Math.max(...scoreHistory.map((s) => s.paesScoreMid))
        : null;

    const hasFullTests = scoreHistory.some(
      (s) => s.type === "full_test"
    );
    const displayHistory = hasFullTests
      ? scoreHistory.filter((s) => s.type === "full_test")
      : scoreHistory;

    return NextResponse.json({
      success: true,
      data: {
        masteryBreakdown,
        axisMastery,
        personalBest,
        scoreHistory: displayHistory,
        projection,
        retestStatus,
        currentScore,
        goalMilestones,
        defaultAtomsPerWeek: targets.defaultAtomsPerWeek,
      },
    });
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar progreso" },
      { status: 500 }
    );
  }
}
