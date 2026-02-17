import { NextResponse } from "next/server";
import { db } from "@/db";
import { generatedQuestions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/generated-questions/:questionId
 *
 * Returns the full record for a single generated question,
 * including the qti_xml content needed for rendering.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: "Missing questionId parameter" },
        { status: 400 }
      );
    }

    const rows = await db
      .select()
      .from(generatedQuestions)
      .where(eq(generatedQuestions.id, questionId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Question ${questionId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, question: rows[0] });
  } catch (error) {
    console.error("[Generated Questions] Error fetching:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch generated question" },
      { status: 500 }
    );
  }
}
