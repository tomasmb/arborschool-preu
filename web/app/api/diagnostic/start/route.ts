import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts } from "@/db/schema";

/**
 * POST /api/diagnostic/start
 * Creates a new diagnostic test attempt.
 * Accepts optional userId to link the attempt from the start
 * (when user registered via mini-form before the test).
 */
export async function POST(request: NextRequest) {
  try {
    // Parse optional userId from request body
    let userId: string | undefined;
    try {
      const body = await request.json();
      userId = body.userId ?? undefined;
    } catch {
      // No body or invalid JSON — proceed without userId
    }

    const [attempt] = await db
      .insert(testAttempts)
      .values({
        userId: userId ?? null,
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
