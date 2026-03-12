import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentResponses } from "@/db/schema";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import { isValidUuid } from "@/lib/student/apiEnvelope";

/**
 * POST /api/student/full-test/answer
 * Records a single question response during a full test.
 * Modeled after /api/diagnostic/response for consistency.
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
      questionIndex,
      responseTimeSeconds,
    } = body;

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

    if (!isValidUuid(attemptId) || !isValidUuid(questionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid UUID format" },
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
        responseTimeSeconds: responseTimeSeconds ?? 0,
        questionIndex,
        answeredAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [studentResponses.testAttemptId, studentResponses.questionId],
        set: {
          selectedAnswer,
          isCorrect,
          answeredAt: new Date(),
        },
      })
      .returning({ id: studentResponses.id });

    return NextResponse.json({
      success: true,
      data: { responseId: response.id },
    });
  } catch (error) {
    console.error("Failed to record full test answer:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar respuesta" },
      { status: 500 }
    );
  }
}
