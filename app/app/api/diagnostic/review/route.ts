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
 *
 * When alternateQuestionId is provided, fetches that exact question.
 * Otherwise falls back to fetching any alternate by parent question ID.
 *
 * Note: correctAnswer is parsed from qtiXml (single source of truth)
 *
 * Request body:
 * {
 *   questions: Array<{
 *     exam: string,
 *     questionNumber: string,
 *     alternateQuestionId?: string  // The exact alternate shown during diagnostic
 *   }>
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

    // Separate questions with exact IDs from those needing parent lookup
    const exactIds: string[] = [];
    const parentLookups: { parentId: string; exam: string; qNum: number }[] =
      [];

    for (const q of questionRefs) {
      const exam = q.exam.toLowerCase();
      const qNum = parseInt(q.questionNumber.replace(/\D/g, ""), 10);
      const parentId = `${exam}-Q${qNum}`;

      if (q.alternateQuestionId) {
        exactIds.push(q.alternateQuestionId);
      } else {
        parentLookups.push({ parentId, exam, qNum });
      }
    }

    const questionDataMap: Record<string, QuestionReviewData> = {};

    // Fetch questions by exact alternate ID (most accurate)
    if (exactIds.length > 0) {
      const exactQuestions = await db
        .select({
          id: questions.id,
          qtiXml: questions.qtiXml,
          title: questions.title,
          parentQuestionId: questions.parentQuestionId,
        })
        .from(questions)
        .where(inArray(questions.id, exactIds));

      for (const q of exactQuestions) {
        // Key by parent question ID to match frontend expectations
        const key = q.parentQuestionId!;
        const parsed = parseQtiXml(q.qtiXml);

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
    }

    // Fallback: fetch alternates by parent ID for questions without exact ID
    if (parentLookups.length > 0) {
      const parentIds = parentLookups.map((p) => p.parentId);
      // Only fetch for parent IDs not already resolved
      const missingParentIds = parentIds.filter((id) => !questionDataMap[id]);

      if (missingParentIds.length > 0) {
        const fallbackQuestions = await db
          .select({
            id: questions.id,
            qtiXml: questions.qtiXml,
            title: questions.title,
            parentQuestionId: questions.parentQuestionId,
          })
          .from(questions)
          .where(
            and(
              inArray(questions.parentQuestionId, missingParentIds),
              eq(questions.source, "alternate")
            )
          );

        for (const q of fallbackQuestions) {
          const key = q.parentQuestionId!;
          // Only add if not already present (exact ID takes precedence)
          if (!questionDataMap[key]) {
            const parsed = parseQtiXml(q.qtiXml);

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
        }
      }
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
