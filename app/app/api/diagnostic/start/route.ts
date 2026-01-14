import { NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts } from "@/db/schema";

/**
 * POST /api/diagnostic/start
 * Creates a new diagnostic test attempt (can be anonymous)
 */
export async function POST() {
  try {
    const [attempt] = await db
      .insert(testAttempts)
      .values({
        startedAt: new Date(),
        totalQuestions: 16,
      })
      .returning({ id: testAttempts.id });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
    });
  } catch (error) {
    console.error("Failed to start diagnostic:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start diagnostic" },
      { status: 500 }
    );
  }
}
