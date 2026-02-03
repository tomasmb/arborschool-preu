import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, questionAtoms } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/diagnostic/question
 * Fetch question content by exam and question number
 * Always returns alternate questions (never official ones)
 * Includes atoms associated with the question for mastery tracking
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

    // Normalize exam name to lowercase for DB matching
    const examNormalized = exam.toLowerCase();

    // Build the original (official) question ID to find its alternate
    const originalQuestionId = `${examNormalized}-Q${qNum}`;

    // Query for alternate question by parent_question_id
    // We always use alternates instead of official questions
    const result = await db
      .select({
        id: questions.id,
        qtiXml: questions.qtiXml,
        correctAnswer: questions.correctAnswer,
        title: questions.title,
        source: questions.source,
      })
      .from(questions)
      .where(
        and(
          eq(questions.parentQuestionId, originalQuestionId),
          eq(questions.source, "alternate")
        )
      )
      .limit(1);

    if (result.length === 0) {
      console.error(
        `No alternate question found for parent: ${originalQuestionId}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Alternate question not found for ${originalQuestionId}`,
        },
        { status: 404 }
      );
    }

    const question = result[0];

    // Fetch atoms linked to this question
    const atoms = await db
      .select({
        atomId: questionAtoms.atomId,
        relevance: questionAtoms.relevance,
      })
      .from(questionAtoms)
      .where(eq(questionAtoms.questionId, question.id));

    // Convert "ChoiceA" -> "A", "ChoiceB" -> "B", etc.
    let correctAnswer = question.correctAnswer;
    if (correctAnswer?.startsWith("Choice")) {
      correctAnswer = correctAnswer.replace("Choice", "");
    }

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        qtiXml: question.qtiXml,
        correctAnswer,
        title: question.title,
        atoms: atoms.map((a) => ({
          atomId: a.atomId,
          relevance: a.relevance,
        })),
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
