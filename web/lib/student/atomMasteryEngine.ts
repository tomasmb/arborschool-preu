/**
 * Atom Mastery Engine — DB operations for the Arbor adaptive mastery system.
 * Types and pure algorithm live in ./atomMasteryAlgorithm.ts.
 */

import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
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
  type SessionStatus,
} from "./atomMasteryAlgorithm";
import {
  determineMasteryQuality,
  initializeReviewSchedule,
  incrementSessionCounters,
  applyImplicitRepetition,
  applyInactivityDecay,
} from "./spacedRepetition";
import { startPrereqScan, checkCooldownExpiry } from "./prerequisiteScan";
import type { ScanStartResult } from "./prerequisiteScan";
import type { HabitGuardSignal } from "./habitGuard";
import {
  syncAtomMasteryOnMastered,
  countNewlyUnlockedQuestions,
  getNextStudyAtom,
  evaluateHabitGuard,
} from "./masteryLifecycle";

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

export type AnswerResultWithLifecycle = AnswerResultPayload & {
  prereqScan?: {
    sessionId: string | null;
    prereqCount: number;
    status: "in_progress" | "no_prereqs";
  };
  cooldownApplied?: boolean;
  questionsUnlocked?: number;
  nextAtom?: { id: string; title: string } | null;
  habitGuard?: HabitGuardSignal;
};
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
/** Creates (or resumes) a mastery session for the given user + atom. */
export async function createAtomSession(
  userId: string,
  atomId: string
): Promise<AtomSessionPayload> {
  await applyInactivityDecay(userId);

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

/** Grades an answer, runs mastery algorithm, triggers lifecycle hooks. */
export async function submitAnswer(params: {
  sessionId: string;
  responseId: string;
  selectedAnswer: string;
  userId: string;
  responseTimeSeconds?: number;
}): Promise<AnswerResultWithLifecycle> {
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

  let scanResult: ScanStartResult | undefined;
  let cooldownApplied = false;
  let questionsUnlocked: number | undefined;
  let nextAtom: { id: string; title: string } | null | undefined;

  if (updated.status === "mastered") {
    await syncAtomMasteryOnMastered(params.userId, session.atomId);

    const accuracy =
      updated.totalQuestions > 0
        ? updated.correctQuestions / updated.totalQuestions
        : 0;
    const quality = determineMasteryQuality(updated.totalQuestions, accuracy);
    await initializeReviewSchedule(params.userId, session.atomId, quality);
    await applyImplicitRepetition(params.userId, session.atomId);
    await checkCooldownExpiry(params.userId, session.atomId);
    await incrementSessionCounters(params.userId);

    [questionsUnlocked, nextAtom] = await Promise.all([
      countNewlyUnlockedQuestions(params.userId, session.atomId),
      getNextStudyAtom(params.userId, session.atomId),
    ]);
  }

  if (updated.status === "failed") {
    scanResult = await startPrereqScan(params.userId, session.atomId);
    cooldownApplied = scanResult.status === "no_prereqs";
    await incrementSessionCounters(params.userId);
  }

  const habitGuard = isTerminal
    ? undefined
    : await evaluateHabitGuard(params.userId, updated.consecutiveIncorrect);

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
    prereqScan: scanResult
      ? {
          sessionId: scanResult.sessionId,
          prereqCount: scanResult.prereqCount,
          status: scanResult.status,
        }
      : undefined,
    cooldownApplied,
    questionsUnlocked,
    nextAtom,
    habitGuard,
  };
}

export { getSessionState } from "./atomSessionState";
