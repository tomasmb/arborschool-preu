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

/**
 * GET /api/student/progress
 * Returns mastery breakdown, axis mastery, score history, projection,
 * retest status, and current/target scores.
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
      projection,
      retestStatus,
      snapshot,
      masteryBreakdown,
      axisMastery,
    ] = await Promise.all([
      getScoreHistory(userId),
      buildProjectionCurve({ userId, atomsPerWeek }),
      getRetestStatus(userId),
      getUserDiagnosticSnapshot(userId),
      getMasteryStatusBreakdown(userId),
      getAxisMasteryBreakdown(userId),
    ]);

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
        targetScore: snapshot?.paesScoreMax ?? null,
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
