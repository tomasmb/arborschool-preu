/**
 * Session state reader — extracts the full state of an atom study session.
 * Separated from atomMasteryEngine.ts for file-length compliance.
 */

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  atomStudyResponses,
  atomStudySessions,
  atoms,
  generatedQuestions,
  lessons,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/diagnostic/qtiParser";
import type {
  SessionDifficulty,
  SessionResponsePayload,
  SessionStatePayload,
  SessionStatus,
} from "./atomMasteryAlgorithm";

/** Full session state with parsed questions. Correct answers hidden until answered. */
export async function getSessionState(
  sessionId: string,
  userId: string
): Promise<SessionStatePayload | null> {
  const [row] = await db
    .select()
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.id, sessionId),
        eq(atomStudySessions.userId, userId)
      )
    )
    .limit(1);
  if (!row) return null;

  const [[atom], [lesson], responseRows] = await Promise.all([
    db
      .select({ title: atoms.title })
      .from(atoms)
      .where(eq(atoms.id, row.atomId))
      .limit(1),
    db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.atomId, row.atomId))
      .limit(1),
    db
      .select({
        responseId: atomStudyResponses.id,
        position: atomStudyResponses.position,
        difficultyLevel: atomStudyResponses.difficultyLevel,
        selectedAnswer: atomStudyResponses.selectedAnswer,
        isCorrect: atomStudyResponses.isCorrect,
        qtiXml: generatedQuestions.qtiXml,
      })
      .from(atomStudyResponses)
      .innerJoin(
        generatedQuestions,
        eq(generatedQuestions.id, atomStudyResponses.questionId)
      )
      .where(eq(atomStudyResponses.sessionId, sessionId))
      .orderBy(asc(atomStudyResponses.position)),
  ]);

  const responses: SessionResponsePayload[] = responseRows.map((r) => {
    const parsed = parseQtiXml(r.qtiXml);
    return {
      responseId: r.responseId,
      position: r.position,
      questionHtml: parsed.html,
      options: parsed.options,
      difficultyLevel: r.difficultyLevel,
      selectedAnswer: r.selectedAnswer,
      isCorrect: r.isCorrect,
      correctAnswer: r.selectedAnswer !== null ? parsed.correctAnswer : null,
    };
  });

  return {
    sessionId: row.id,
    atomId: row.atomId,
    atomTitle: atom?.title ?? row.atomId,
    status: row.status as SessionStatus,
    currentDifficulty: row.currentDifficulty as SessionDifficulty,
    totalQuestions: row.totalQuestions,
    correctQuestions: row.correctQuestions,
    consecutiveCorrect: row.consecutiveCorrect,
    consecutiveIncorrect: row.consecutiveIncorrect,
    attemptNumber: row.attemptNumber,
    hasLesson: Boolean(lesson),
    lessonViewedAt: row.lessonViewedAt,
    responses,
  };
}
