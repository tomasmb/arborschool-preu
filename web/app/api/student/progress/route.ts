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
    if (m.neededM1Score === null) {
      return { ...m, weeksToReach: null };
    }
    const point = points.find((p) => p.projectedScoreMid >= m.neededM1Score!);
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

    const projection = await buildProjectionCurve({
      userId,
      atomsPerWeek,
      targetScore: targets.highestTargetM1,
    });

    const goalMilestones = enrichMilestonesWithWeeks(
      targets.milestones,
      projection.points
    );

    const currentScore =
      snapshot?.paesScoreMin != null && snapshot?.paesScoreMax != null
        ? {
            min: snapshot.paesScoreMin,
            max: snapshot.paesScoreMax,
            mid: Math.round(
              (snapshot.paesScoreMin + snapshot.paesScoreMax) / 2
            ),
          }
        : null;

    const personalBest =
      scoreHistory.length > 0
        ? Math.max(...scoreHistory.map((s) => s.paesScoreMid))
        : null;

    return NextResponse.json({
      success: true,
      data: {
        masteryBreakdown,
        axisMastery,
        personalBest,
        scoreHistory,
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
