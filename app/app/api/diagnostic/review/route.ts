import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * POST /api/diagnostic/review
 *
 * Fetch question content and feedback for review after diagnostic.
 * Returns QTI XML, correct answer, and feedback for each question.
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

    // Build lookup keys: exam-questionNumber
    const lookupKeys = questionRefs.map((q) => ({
      exam: q.exam.toLowerCase(),
      qNum: parseInt(q.questionNumber.replace(/\D/g, ""), 10),
    }));

    // Fetch all questions in one query
    const allQuestions = await db
      .select({
        id: questions.id,
        qtiXml: questions.qtiXml,
        correctAnswer: questions.correctAnswer,
        title: questions.title,
        feedbackGeneral: questions.feedbackGeneral,
        feedbackPerOption: questions.feedbackPerOption,
        sourceTestId: questions.sourceTestId,
        sourceQuestionNumber: questions.sourceQuestionNumber,
      })
      .from(questions);

    // Filter to matching questions
    const matchedQuestions = allQuestions.filter((q) =>
      lookupKeys.some(
        (key) =>
          q.sourceTestId === key.exam && q.sourceQuestionNumber === key.qNum
      )
    );

    // Build response map keyed by exam-questionNumber
    const questionDataMap: Record<string, QuestionReviewData> = {};

    for (const q of matchedQuestions) {
      const key = `${q.sourceTestId}-Q${q.sourceQuestionNumber}`;

      // Normalize correct answer (ChoiceA -> A)
      let correctAnswer = q.correctAnswer;
      if (correctAnswer?.startsWith("Choice")) {
        correctAnswer = correctAnswer.replace("Choice", "");
      }

      questionDataMap[key] = {
        id: q.id,
        qtiXml: q.qtiXml,
        correctAnswer,
        title: q.title,
        feedbackGeneral: q.feedbackGeneral,
        feedbackPerOption: q.feedbackPerOption as Record<string, string> | null,
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
  feedbackGeneral: string | null;
  feedbackPerOption: Record<string, string> | null;
}
