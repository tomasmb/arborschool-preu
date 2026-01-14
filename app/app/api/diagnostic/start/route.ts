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

    if (!attempt?.id) {
      console.error("Database insert returned no ID");
      return NextResponse.json(
        { success: false, error: "Database error: no ID returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error("Failed to start diagnostic:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Database error: ${error instanceof Error ? error.message : "Unknown"}`
            : "Failed to start diagnostic",
      },
      { status: 500 }
    );
  }
}
