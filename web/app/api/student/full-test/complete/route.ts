import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { testAttempts, questionAtoms, atoms } from "@/db/schema";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import { recalibrateScore } from "@/lib/student/fullTest";
import { calculateAxisPerformance, type Axis } from "@/lib/diagnostic/config";

/**
 * POST /api/student/full-test/complete
 * Completes a full test and recalibrates the student's PAES score.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

    const body = await request.json();
    const { attemptId, correctAnswers, totalQuestions, answeredQuestions } =
      body as {
        attemptId: string;
        correctAnswers: number;
        totalQuestions: number;
        answeredQuestions: {
          originalQuestionId: string;
          isCorrect: boolean;
        }[];
      };

    if (!attemptId || correctAnswers === undefined || !answeredQuestions) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [attempt] = await db
      .select({ id: testAttempts.id })
      .from(testAttempts)
      .where(
        and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId))
      )
      .limit(1);

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Test attempt not found" },
        { status: 404 }
      );
    }

    const [result, axisPerformance] = await Promise.all([
      recalibrateScore({
        userId,
        attemptId,
        correctAnswers,
        totalQuestions,
        answeredQuestions,
      }),
      buildAxisPerformance(answeredQuestions),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        paesScore: result.paesScore,
        paesScoreMin: result.paesScoreMin,
        paesScoreMax: result.paesScoreMax,
        level: result.level,
        correctAnswers,
        totalQuestions,
        axisPerformance,
      },
    });
  } catch (error) {
    console.error("Failed to complete full test:", error);
    return NextResponse.json(
      { success: false, error: "Error al completar el test" },
      { status: 500 }
    );
  }
}

const DB_AXIS_TO_CODE: Record<string, Axis> = {
  algebra_y_funciones: "ALG",
  numeros: "NUM",
  geometria: "GEO",
  probabilidad_y_estadistica: "PROB",
};

/**
 * Derives axis performance from answered questions by looking up
 * each question's primary atom axis.
 */
async function buildAxisPerformance(
  answeredQuestions: { originalQuestionId: string; isCorrect: boolean }[]
) {
  const questionIds = answeredQuestions.map((q) => q.originalQuestionId);
  if (questionIds.length === 0) {
    return calculateAxisPerformance([]);
  }

  const axisRows = await db
    .select({
      questionId: questionAtoms.questionId,
      axis: atoms.axis,
    })
    .from(questionAtoms)
    .innerJoin(atoms, eq(atoms.id, questionAtoms.atomId))
    .where(
      and(
        inArray(questionAtoms.questionId, questionIds),
        eq(questionAtoms.relevance, "primary")
      )
    );

  const axisByQuestion = new Map<string, Axis>();
  for (const row of axisRows) {
    if (!axisByQuestion.has(row.questionId)) {
      const code = DB_AXIS_TO_CODE[row.axis];
      if (code) axisByQuestion.set(row.questionId, code);
    }
  }

  const responses = answeredQuestions
    .filter((q) => axisByQuestion.has(q.originalQuestionId))
    .map((q) => ({
      axis: axisByQuestion.get(q.originalQuestionId)!,
      correct: q.isCorrect,
    }));

  return calculateAxisPerformance(responses);
}
