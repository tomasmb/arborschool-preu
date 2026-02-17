import { NextResponse } from "next/server";
import { db } from "@/db";
import { generatedQuestions } from "@/db/schema";
import { eq, count } from "drizzle-orm";

/**
 * GET /api/atoms/:atomId/generated-questions/stats
 *
 * Returns the difficulty distribution for an atom's generated questions.
 * Response: { low: number, medium: number, high: number, total: number }
 */
export async function GET(
  _request: Request,
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

    const rows = await db
      .select({
        difficultyLevel: generatedQuestions.difficultyLevel,
        count: count(),
      })
      .from(generatedQuestions)
      .where(eq(generatedQuestions.atomId, atomId))
      .groupBy(generatedQuestions.difficultyLevel);

    // Build stats object with defaults of 0
    const stats = { low: 0, medium: 0, high: 0, total: 0 };
    for (const row of rows) {
      const n = Number(row.count);
      stats[row.difficultyLevel] = n;
      stats.total += n;
    }

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("[Generated Questions] Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch question stats" },
      { status: 500 }
    );
  }
}
