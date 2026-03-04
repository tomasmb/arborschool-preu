import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";

/**
 * POST /api/diagnostic/complete
 * Marks a diagnostic test as completed with final results
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
      correctAnswers,
      scorePercentage,
      stage1Score,
      stage2Difficulty,
    } = body;

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: "Missing attemptId" },
        { status: 400 }
      );
    }

    await db
      .update(testAttempts)
      .set({
        completedAt: new Date(),
        correctAnswers,
        scorePercentage: scorePercentage?.toString(),
        stage1Score,
        stage2Difficulty,
      })
      .where(
        and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to complete diagnostic:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete diagnostic" },
      { status: 500 }
    );
  }
}
