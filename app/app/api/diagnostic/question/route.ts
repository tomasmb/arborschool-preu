import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/diagnostic/question
 * Fetch question content by exam and question number
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exam = searchParams.get("exam");
    const questionNumber = searchParams.get("questionNumber");

    if (!exam || !questionNumber) {
      return NextResponse.json(
        { success: false, error: "Missing exam or questionNumber" },
        { status: 400 }
      );
    }

    // Extract numeric question number (Q28 -> 28)
    const qNum = parseInt(questionNumber.replace(/\D/g, ""), 10);

    // Query by source test and question number
    const result = await db
      .select({
        id: questions.id,
        qtiXml: questions.qtiXml,
        correctAnswer: questions.correctAnswer,
        title: questions.title,
      })
      .from(questions)
      .where(
        and(
          eq(questions.sourceTestId, exam),
          eq(questions.sourceQuestionNumber, qNum)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    const question = result[0];

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        qtiXml: question.qtiXml,
        correctAnswer: question.correctAnswer,
        title: question.title,
      },
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
