/**
 * Atom Mastery Engine — DB operations for the Arbor adaptive mastery system.
 * Types and pure algorithm live in ./atomMasteryAlgorithm.ts.
 */

import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atomStudyResponses,
  atomStudySessions,
  atoms,
  generatedQuestions,
  lessons,
} from "@/db/schema";
import {
  parseQtiXml,
  extractFeedbackFromQti,
} from "@/lib/diagnostic/qtiParser";
import {
  computeUpdatedState,
  DIFF_FALLBACKS,
  DIFF_MAP,
  MAX_ATTEMPTS,
  MAX_QUESTIONS,
  type AnswerResultPayload,
  type AtomSessionPayload,
  type NextQuestionPayload,
  type SessionDifficulty,
  type SessionResponsePayload,
  type SessionStatePayload,
  type SessionStatus,
} from "./atomMasteryAlgorithm";

export type {
  AnswerResultPayload,
  AtomSessionPayload,
  NextQuestionPayload,
  SessionDifficulty,
  SessionResponsePayload,
  SessionStatePayload,
  SessionStatus,
} from "./atomMasteryAlgorithm";
export { computeUpdatedState } from "./atomMasteryAlgorithm";

// ============================================================================
// HELPERS
// ============================================================================

function normalizeAnswer(v: string): string {
  return v.trim().toUpperCase();
}

async function verifyOwnership(sessionId: string, userId: string) {
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
  return row ?? null;
}

/** Collects all question IDs already used across every session for a user+atom */
async function getUsedQuestionIds(
  userId: string,
  atomId: string
): Promise<string[]> {
  const sessions = await db
    .select({ id: atomStudySessions.id })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.atomId, atomId)
      )
    );
  if (sessions.length === 0) return [];

  const rows = await db
    .select({ questionId: atomStudyResponses.questionId })
    .from(atomStudyResponses)
    .where(
      inArray(
        atomStudyResponses.sessionId,
        sessions.map((s) => s.id)
      )
    );
  return rows.map((r) => r.questionId);
}

/** Queries candidate generated questions for an atom at a specific difficulty */
async function findQuestions(
  atomId: string,
  difficulty: "low" | "medium" | "high",
  excludeIds: string[],
  limit = 10
) {
  const conds = [
    eq(generatedQuestions.atomId, atomId),
    eq(generatedQuestions.difficultyLevel, difficulty),
  ];
  if (excludeIds.length > 0) {
    conds.push(notInArray(generatedQuestions.id, excludeIds));
  }
  return db
    .select({ id: generatedQuestions.id, qtiXml: generatedQuestions.qtiXml })
    .from(generatedQuestions)
    .where(and(...conds))
    .orderBy(desc(generatedQuestions.createdAt))
    .limit(limit);
}

/** Syncs the atom_mastery summary row when a session reaches mastered */
async function syncAtomMasteryOnMastered(userId: string, atomId: string) {
  const now = new Date();
  const common = {
    status: "mastered" as const,
    isMastered: true,
    masterySource: "study" as const,
  };
  await db
    .insert(atomMastery)
    .values({
      userId,
      atomId,
      ...common,
      firstMasteredAt: now,
      lastDemonstratedAt: now,
    })
    .onConflictDoUpdate({
      target: [atomMastery.userId, atomMastery.atomId],
      set: {
        ...common,
        firstMasteredAt: sql`COALESCE(${atomMastery.firstMasteredAt}, NOW())`,
        lastDemonstratedAt: now,
        updatedAt: now,
      },
    });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/** Creates (or resumes) a mastery session for the given user + atom. */
export async function createAtomSession(
  userId: string,
  atomId: string
): Promise<AtomSessionPayload> {
  const [atom] = await db
    .select({ id: atoms.id, title: atoms.title })
    .from(atoms)
    .where(eq(atoms.id, atomId))
    .limit(1);
  if (!atom) throw new Error("Atom not found");

  const [active] = await db
    .select({
      id: atomStudySessions.id,
      status: atomStudySessions.status,
      attemptNumber: atomStudySessions.attemptNumber,
    })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.atomId, atomId),
        inArray(atomStudySessions.status, ["lesson", "in_progress"])
      )
    )
    .limit(1);

  const [lesson] = await db
    .select({ id: lessons.id, lessonHtml: lessons.lessonHtml })
    .from(lessons)
    .where(eq(lessons.atomId, atomId))
    .limit(1);

  if (active) {
    return {
      sessionId: active.id,
      atomId,
      atomTitle: atom.title,
      hasLesson: Boolean(lesson),
      lessonHtml: lesson?.lessonHtml ?? null,
      status: active.status as SessionStatus,
      attemptNumber: active.attemptNumber,
    };
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.atomId, atomId)
      )
    );
  const priorAttempts = Number(countRow?.count ?? 0);
  if (priorAttempts >= MAX_ATTEMPTS) {
    throw new Error(`Maximum attempts (${MAX_ATTEMPTS}) reached for this atom`);
  }

  const initialStatus: SessionStatus = lesson ? "lesson" : "in_progress";
  const attemptNumber = priorAttempts + 1;

  const [session] = await db
    .insert(atomStudySessions)
    .values({
      userId,
      atomId,
      sessionType: "mastery",
      attemptNumber,
      status: initialStatus,
      currentDifficulty: "easy",
    })
    .returning({ id: atomStudySessions.id });

  // Ensure atom_mastery row exists (won't overwrite existing progress)
  await db
    .insert(atomMastery)
    .values({ userId, atomId, status: "in_progress", isMastered: false })
    .onConflictDoUpdate({
      target: [atomMastery.userId, atomMastery.atomId],
      set: { updatedAt: new Date() },
    });

  return {
    sessionId: session.id,
    atomId,
    atomTitle: atom.title,
    hasLesson: Boolean(lesson),
    lessonHtml: lesson?.lessonHtml ?? null,
    status: initialStatus,
    attemptNumber,
  };
}

/** Marks the lesson phase as viewed, transitioning to "in_progress". */
export async function markLessonViewed(
  sessionId: string,
  userId: string
): Promise<{ success: boolean }> {
  const session = await verifyOwnership(sessionId, userId);
  if (!session) throw new Error("Session not found");

  if (session.status === "lesson") {
    await db
      .update(atomStudySessions)
      .set({ lessonViewedAt: new Date(), status: "in_progress" })
      .where(eq(atomStudySessions.id, sessionId));
  }
  return { success: true };
}

/** Serves the next adaptive question; creates a placeholder response row. */
export async function getNextQuestion(
  sessionId: string,
  userId: string
): Promise<NextQuestionPayload> {
  const session = await verifyOwnership(sessionId, userId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "in_progress") {
    throw new Error(`Session is ${session.status}, cannot serve next question`);
  }
  if (session.totalQuestions >= MAX_QUESTIONS) {
    throw new Error("Maximum questions reached for this session");
  }

  // Return existing pending question if one exists (idempotent)
  const [pending] = await db
    .select({
      id: atomStudyResponses.id,
      questionId: atomStudyResponses.questionId,
      position: atomStudyResponses.position,
      difficultyLevel: atomStudyResponses.difficultyLevel,
    })
    .from(atomStudyResponses)
    .where(
      and(
        eq(atomStudyResponses.sessionId, sessionId),
        sql`${atomStudyResponses.answeredAt} IS NULL`
      )
    )
    .limit(1);

  if (pending) {
    const [q] = await db
      .select({ qtiXml: generatedQuestions.qtiXml })
      .from(generatedQuestions)
      .where(eq(generatedQuestions.id, pending.questionId))
      .limit(1);
    const parsed = parseQtiXml(q.qtiXml);
    return {
      responseId: pending.id,
      questionHtml: parsed.html,
      options: parsed.options,
      difficultyLevel: pending.difficultyLevel as SessionDifficulty,
      position: pending.position,
      totalQuestions: session.totalQuestions,
    };
  }

  const targetDiff = DIFF_MAP[session.currentDifficulty as SessionDifficulty];
  const usedIds = await getUsedQuestionIds(userId, session.atomId);

  let candidates = await findQuestions(session.atomId, targetDiff, usedIds);
  if (candidates.length === 0) {
    for (const fallback of DIFF_FALLBACKS[targetDiff]) {
      candidates = await findQuestions(session.atomId, fallback, usedIds);
      if (candidates.length > 0) break;
    }
  }
  if (candidates.length === 0) {
    throw new Error("No questions available for this atom");
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const parsed = parseQtiXml(picked.qtiXml);
  const position = session.totalQuestions + 1;

  const [response] = await db
    .insert(atomStudyResponses)
    .values({
      sessionId,
      questionId: picked.id,
      position,
      difficultyLevel: session.currentDifficulty as SessionDifficulty,
    })
    .returning({ id: atomStudyResponses.id });

  return {
    responseId: response.id,
    questionHtml: parsed.html,
    options: parsed.options,
    difficultyLevel: session.currentDifficulty as SessionDifficulty,
    position,
    totalQuestions: session.totalQuestions,
  };
}

/** Grades an answer, runs mastery algorithm, syncs atom_mastery on terminal. */
export async function submitAnswer(params: {
  sessionId: string;
  responseId: string;
  selectedAnswer: string;
  userId: string;
  responseTimeSeconds?: number;
}): Promise<AnswerResultPayload> {
  const session = await verifyOwnership(params.sessionId, params.userId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "in_progress") {
    throw new Error(`Session is ${session.status}, not accepting answers`);
  }

  const [response] = await db
    .select({
      id: atomStudyResponses.id,
      questionId: atomStudyResponses.questionId,
      difficultyLevel: atomStudyResponses.difficultyLevel,
    })
    .from(atomStudyResponses)
    .where(
      and(
        eq(atomStudyResponses.id, params.responseId),
        eq(atomStudyResponses.sessionId, params.sessionId)
      )
    )
    .limit(1);
  if (!response) throw new Error("Response not found");

  const [question] = await db
    .select({ qtiXml: generatedQuestions.qtiXml })
    .from(generatedQuestions)
    .where(eq(generatedQuestions.id, response.questionId))
    .limit(1);
  if (!question) throw new Error("Question not found");

  const parsed = parseQtiXml(question.qtiXml);
  const correctAnswer = parsed.correctAnswer
    ? normalizeAnswer(parsed.correctAnswer)
    : null;
  if (!correctAnswer) throw new Error("Question has no valid correct answer");

  const normalized = normalizeAnswer(params.selectedAnswer);
  const isCorrect = normalized === correctAnswer;

  await db
    .update(atomStudyResponses)
    .set({
      selectedAnswer: normalized,
      isCorrect,
      responseTimeSeconds: params.responseTimeSeconds,
      answeredAt: new Date(),
    })
    .where(eq(atomStudyResponses.id, response.id));

  const difficulty = response.difficultyLevel as SessionDifficulty;
  const updated = computeUpdatedState(
    {
      status: session.status as SessionStatus,
      currentDifficulty: session.currentDifficulty as SessionDifficulty,
      easyStreak: session.easyStreak,
      mediumStreak: session.mediumStreak,
      hardStreak: session.hardStreak,
      consecutiveCorrect: session.consecutiveCorrect,
      consecutiveIncorrect: session.consecutiveIncorrect,
      hardCorrectInStreak: session.hardCorrectInStreak,
      totalQuestions: session.totalQuestions,
      correctQuestions: session.correctQuestions,
    },
    isCorrect,
    difficulty
  );

  const isTerminal =
    updated.status === "mastered" || updated.status === "failed";

  await db
    .update(atomStudySessions)
    .set({
      status: updated.status,
      currentDifficulty: updated.currentDifficulty,
      easyStreak: updated.easyStreak,
      mediumStreak: updated.mediumStreak,
      hardStreak: updated.hardStreak,
      consecutiveCorrect: updated.consecutiveCorrect,
      consecutiveIncorrect: updated.consecutiveIncorrect,
      hardCorrectInStreak: updated.hardCorrectInStreak,
      totalQuestions: updated.totalQuestions,
      correctQuestions: updated.correctQuestions,
      ...(isTerminal ? { completedAt: new Date() } : {}),
    })
    .where(eq(atomStudySessions.id, params.sessionId));

  if (updated.status === "mastered") {
    await syncAtomMasteryOnMastered(params.userId, session.atomId);
  }

  const feedback = extractFeedbackFromQti(question.qtiXml);
  const selectedCf = feedback.choiceFeedbacks.find(
    (cf) => cf.letter === normalized
  );
  const correctCf = feedback.choiceFeedbacks.find(
    (cf) => cf.letter === correctAnswer
  );

  return {
    sessionId: params.sessionId,
    responseId: params.responseId,
    isCorrect,
    correctAnswer,
    status: updated.status,
    currentDifficulty: updated.currentDifficulty,
    consecutiveCorrect: updated.consecutiveCorrect,
    totalQuestions: updated.totalQuestions,
    correctQuestions: updated.correctQuestions,
    selectedFeedbackHtml: selectedCf?.feedbackHtml,
    correctFeedbackHtml: correctCf?.feedbackHtml,
    generalFeedbackHtml: feedback.generalFeedbackHtml,
  };
}

/** Full session state with parsed questions. Correct answers hidden until answered. */
export async function getSessionState(
  sessionId: string,
  userId: string
): Promise<SessionStatePayload | null> {
  const session = await verifyOwnership(sessionId, userId);
  if (!session) return null;

  const [[atom], [lesson], responseRows] = await Promise.all([
    db
      .select({ title: atoms.title })
      .from(atoms)
      .where(eq(atoms.id, session.atomId))
      .limit(1),
    db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.atomId, session.atomId))
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
    sessionId: session.id,
    atomId: session.atomId,
    atomTitle: atom?.title ?? session.atomId,
    status: session.status as SessionStatus,
    currentDifficulty: session.currentDifficulty as SessionDifficulty,
    totalQuestions: session.totalQuestions,
    correctQuestions: session.correctQuestions,
    consecutiveCorrect: session.consecutiveCorrect,
    consecutiveIncorrect: session.consecutiveIncorrect,
    attemptNumber: session.attemptNumber,
    hasLesson: Boolean(lesson),
    lessonViewedAt: session.lessonViewedAt,
    responses,
  };
}
