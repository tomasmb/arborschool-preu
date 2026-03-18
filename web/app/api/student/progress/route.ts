import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import {
  getScoreHistory,
  buildProjectionMetadata,
} from "@/lib/student/scoreHistory";
import { getRetestStatus } from "@/lib/student/retestGating";
import { getUserDiagnosticSnapshot } from "@/lib/student/userQueries";
import {
  getMasteryStatusBreakdown,
  getAxisMasteryBreakdown,
} from "@/lib/student/metricsService";
import { getProgressTargets } from "@/lib/student/progressTargets";
import { resolveDisplayScore } from "@/lib/student/scoreDisplay";
import { upsertStudentTestHours } from "@/lib/student/goals.write";

/**
 * GET /api/student/progress
 *
 * Returns mastery breakdown, axis mastery, score history, projection
 * metadata (unlock curve + uncertainty), retest status, goal milestones,
 * and current scores. The client builds knowledge-based projections
 * locally from metadata.
 */
export async function GET() {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

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
      targets.studentM1Target ?? targets.highestUserM1 ?? targets.highestTargetM1;

    const projectionMetadata = await buildProjectionMetadata({
      userId,
      targetScore: projectionTarget,
      startingScore: display?.score ?? null,
    });

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

    const hasFullTests = scoreHistory.some((s) => s.type === "full_test");
    const displayHistory = hasFullTests
      ? scoreHistory.filter((s) => s.type === "full_test")
      : [];

    return NextResponse.json({
      success: true,
      data: {
        masteryBreakdown,
        axisMastery,
        personalBest,
        scoreHistory: displayHistory,
        projectionMetadata,
        retestStatus,
        currentScore,
        goalMilestones: targets.milestones.map((m) => ({
          ...m,
          weeksToReach: null as number | null,
        })),
        defaultAtomsPerWeek: targets.defaultAtomsPerWeek,
        studentM1Target: targets.studentM1Target,
        careerPositioning: targets.careerPositioning,
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

/**
 * PATCH /api/student/progress
 *
 * Persists the per-test weekly minutes when the user adjusts the
 * hours slider on the progress page.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }

    const body = (await request.json()) as {
      testCode?: string;
      weeklyMinutes?: number;
    };

    const testCode = body.testCode ?? "M1";
    const weeklyMinutes = Number(body.weeklyMinutes);

    if (!Number.isFinite(weeklyMinutes) || weeklyMinutes < 30) {
      return NextResponse.json(
        { success: false, error: "weeklyMinutes must be >= 30" },
        { status: 400 }
      );
    }

    await upsertStudentTestHours(authResult.userId, testCode, weeklyMinutes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save study hours:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar horas" },
      { status: 500 }
    );
  }
}
