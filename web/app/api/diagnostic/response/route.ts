import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentResponses } from "@/db/schema";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";

/**
 * POST /api/diagnostic/response
 * Records a single question response
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

    const body = await request.json();
    const {
      attemptId,
      questionId,
      selectedAnswer,
      isCorrect,
      stage,
      questionIndex,
    } = body;
    const responseTimeSeconds =
      body.responseTimeSeconds ?? body.responseTime ?? 0;

    if (
      !attemptId ||
      !questionId ||
      selectedAnswer === undefined ||
      isCorrect === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [response] = await db
      .insert(studentResponses)
      .values({
        userId,
        testAttemptId: attemptId,
        questionId,
        selectedAnswer,
        isCorrect,
        responseTimeSeconds,
        stage,
        questionIndex,
        answeredAt: new Date(),
      })
      .returning({ id: studentResponses.id });

    return NextResponse.json({
      success: true,
      responseId: response.id,
    });
  } catch (error) {
    console.error("Failed to record response:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record response" },
      { status: 500 }
    );
  }
}
