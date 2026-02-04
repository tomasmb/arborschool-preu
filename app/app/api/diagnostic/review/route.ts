import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { parseQtiXml } from "@/lib/diagnostic/qtiParser";

/**
 * POST /api/diagnostic/review
 *
 * Fetch question content for review after diagnostic.
 * Returns QTI XML and correct answer (parsed from qtiXml) for each question.
 * Always returns alternate questions (never official ones).
 *
 * Note: correctAnswer is parsed from qtiXml (single source of truth)
 *
 * Request body:
 * {
 *   questions: Array<{ exam: string, questionNumber: string }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions: questionRefs } = body;

    if (!Array.isArray(questionRefs) || questionRefs.length === 0) {
      return NextResponse.json(
        { success: false, error: "questions array is required" },
        { status: 400 }
      );
    }

    // Build parent question IDs to find alternates
    // Format: exam-Q{num} (e.g., "prueba-invierno-2025-Q28")
    const parentQuestionIds = questionRefs.map((q) => {
      const exam = q.exam.toLowerCase();
      const qNum = parseInt(q.questionNumber.replace(/\D/g, ""), 10);
      return `${exam}-Q${qNum}`;
    });

    // Fetch alternate questions by parent_question_id
    const matchedQuestions = await db
      .select({
        id: questions.id,
        qtiXml: questions.qtiXml,
        title: questions.title,
        parentQuestionId: questions.parentQuestionId,
      })
      .from(questions)
      .where(
        and(
          inArray(questions.parentQuestionId, parentQuestionIds),
          eq(questions.source, "alternate")
        )
      );

    // Build response map keyed by parent question ID (exam-Q{num})
    const questionDataMap: Record<string, QuestionReviewData> = {};

    for (const q of matchedQuestions) {
      // Use parent question ID as the key (matches frontend expectations)
      const key = q.parentQuestionId!;

      // Parse qtiXml to extract correctAnswer (single source of truth)
      const parsed = parseQtiXml(q.qtiXml);

      // Normalize correct answer (ChoiceA -> A)
      let correctAnswer = parsed.correctAnswer;
      if (correctAnswer?.startsWith("Choice")) {
        correctAnswer = correctAnswer.replace("Choice", "");
      }

      questionDataMap[key] = {
        id: q.id,
        qtiXml: q.qtiXml,
        correctAnswer,
        title: q.title,
      };
    }

    return NextResponse.json({
      success: true,
      data: questionDataMap,
    });
  } catch (error) {
    console.error("Error fetching review data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch review data" },
      { status: 500 }
    );
  }
}

interface QuestionReviewData {
  id: string;
  qtiXml: string;
  correctAnswer: string | null;
  title: string | null;
}
