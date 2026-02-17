import { NextResponse } from "next/server";
import { db } from "@/db";
import { generatedQuestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/atoms/:atomId/generated-questions
 *
 * Lists generated questions for a given atom.
 * Supports optional filtering by difficulty_level query param.
 *
 * Returns a summary per question (no qti_xml to keep payloads small).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ atomId: string }> }
) {
  try {
    const { atomId } = await params;

    if (!atomId) {
      return NextResponse.json(
        { success: false, error: "Missing atomId parameter" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");

    // Build conditions: always filter by atom, optionally by difficulty
    const conditions = difficulty
      ? and(
          eq(generatedQuestions.atomId, atomId),
          eq(
            generatedQuestions.difficultyLevel,
            difficulty as "low" | "medium" | "high"
          )
        )
      : eq(generatedQuestions.atomId, atomId);

    const rows = await db
      .select({
        id: generatedQuestions.id,
        difficultyLevel: generatedQuestions.difficultyLevel,
        componentTag: generatedQuestions.componentTag,
        surfaceContext: generatedQuestions.surfaceContext,
        validators: generatedQuestions.validators,
        createdAt: generatedQuestions.createdAt,
      })
      .from(generatedQuestions)
      .where(conditions)
      .orderBy(generatedQuestions.createdAt);

    return NextResponse.json({ success: true, questions: rows });
  } catch (error) {
    console.error("[Generated Questions] Error listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list generated questions" },
      { status: 500 }
    );
  }
}
