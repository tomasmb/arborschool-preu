import { NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts } from "@/db/schema";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import { getRetestStatus } from "@/lib/student/retestGating";
import {
  getAvailableFullTests,
  getInProgressAttempt,
  resolveTestQuestions,
} from "@/lib/student/fullTest";

/**
 * POST /api/student/full-test/start
 * Starts a new full timed test — or resumes an in-progress one.
 *
 * If the student has an unfinished attempt (started but not completed),
 * returns that attempt's data so the client can resume from localStorage.
 * Otherwise creates a new attempt.
 */
export async function POST() {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

    // Check for an unfinished attempt first (crash recovery)
    const inProgress = await getInProgressAttempt(userId);
    if (inProgress) {
      const questions = await resolveTestQuestions(
        inProgress.testId,
        userId,
        inProgress.attemptId
      );
      const elapsed = Date.now() - inProgress.startedAt.getTime();
      const elapsedMinutes = elapsed / 60_000;
      const totalMinutes = inProgress.timeLimitMinutes ?? 150;
      const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);

      if (remainingMinutes <= 0) {
        // Time expired while away — auto-complete with 0 correct
        return NextResponse.json({
          success: true,
          data: {
            attemptId: inProgress.attemptId,
            testName: inProgress.testName,
            timeLimitMinutes: 0,
            totalQuestions: questions.length,
            questions,
            resumed: true,
            expired: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          attemptId: inProgress.attemptId,
          testName: inProgress.testName,
          timeLimitMinutes: remainingMinutes,
          totalQuestions: questions.length,
          questions,
          resumed: true,
        },
      });
    }

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
    const resolvedQuestions = await resolveTestQuestions(test.id, userId);

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
