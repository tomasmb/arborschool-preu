import { NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts } from "@/db/schema";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import { getRetestStatus } from "@/lib/student/retestGating";
import {
  getAvailableFullTests,
  resolveTestQuestions,
} from "@/lib/student/fullTest";

/**
 * POST /api/student/full-test/start
 * Starts a new full timed test for the authenticated student.
 */
export async function POST() {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

    const retestStatus = await getRetestStatus(userId);
    if (!retestStatus.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: retestStatus.blockedReason ?? "No elegible para test",
        },
        { status: 403 }
      );
    }

    const available = await getAvailableFullTests(userId);
    if (available.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No hay tests completos disponibles",
        },
        { status: 404 }
      );
    }

    const test = available[0];
    const resolvedQuestions = await resolveTestQuestions(test.id);

    const [attempt] = await db
      .insert(testAttempts)
      .values({
        userId,
        testId: test.id,
        startedAt: new Date(),
        totalQuestions: resolvedQuestions.length,
      })
      .returning({ id: testAttempts.id });

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        testName: test.name,
        timeLimitMinutes: test.timeLimitMinutes,
        totalQuestions: resolvedQuestions.length,
        questions: resolvedQuestions,
      },
    });
  } catch (error) {
    console.error("Failed to start full test:", error);
    return NextResponse.json(
      { success: false, error: "Error al iniciar el test" },
      { status: 500 }
    );
  }
}
