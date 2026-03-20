import { NextResponse } from "next/server";
import { PRIVATE_CACHE_HEADERS } from "@/lib/student/apiEnvelope";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import {
  getAvailableFullTests,
  getInProgressAttempt,
  resolveTestQuestions,
} from "@/lib/student/fullTest";
import { FULL_TEST_DURATION_MIN } from "@/lib/diagnostic/scoringConstants";
import { PAES_TOTAL_QUESTIONS } from "@/lib/diagnostic/paesScoreTable";

/**
 * GET /api/student/full-test/info
 * Returns metadata about the next available test without creating an
 * attempt. Used by the pre-test screen to show the real question count.
 */
export async function GET() {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

    const inProgress = await getInProgressAttempt(userId);
    if (inProgress) {
      const questions = await resolveTestQuestions(
        inProgress.testId,
        userId,
        inProgress.attemptId
      );
      return NextResponse.json(
        {
          success: true,
          data: {
            testName: inProgress.testName,
            questionCount: questions.length,
            timeLimitMinutes:
              inProgress.timeLimitMinutes ?? FULL_TEST_DURATION_MIN,
          },
        },
        { headers: PRIVATE_CACHE_HEADERS }
      );
    }

    const available = await getAvailableFullTests(userId);
    if (available.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            testName: null,
            questionCount: PAES_TOTAL_QUESTIONS,
            timeLimitMinutes: FULL_TEST_DURATION_MIN,
          },
        },
        { headers: PRIVATE_CACHE_HEADERS }
      );
    }

    const test = available[0];
    const questions = await resolveTestQuestions(test.id, userId);
    const questionCount =
      questions.length > 0 ? questions.length : PAES_TOTAL_QUESTIONS;

    return NextResponse.json(
      {
        success: true,
        data: {
          testName: test.name,
          questionCount,
          timeLimitMinutes: test.timeLimitMinutes ?? FULL_TEST_DURATION_MIN,
        },
      },
      { headers: PRIVATE_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Failed to fetch test info:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener información del test" },
      { status: 500 }
    );
  }
}
