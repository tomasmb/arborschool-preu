/**
 * Prerequisite Scan — diagnoses WHY a student failed a mini-clase.
 *
 * After a mastery session fails, tests each prerequisite atom with one hard
 * question. First incorrect answer identifies the gap atom. If all prereqs
 * are solid, a cooldown counter is applied to the failed atom.
 */

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atomStudyResponses,
  atomStudySessions,
  atoms,
  generatedQuestions,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/qti/serverParser";
import {
  findGeneratedQuestions,
  getQuestionAtomId,
  getQuestionContent,
  getSeenQuestionIds,
  normalizeAnswer,
} from "./questionQueries";
import { verifySessionOwnership } from "./sessionQueries";

// ============================================================================
// TYPES
// ============================================================================

export type ScanStartResult = {
  sessionId: string | null;
  prereqCount: number;
  status: "in_progress" | "no_prereqs";
};

export type ScanQuestionPayload = {
  responseId: string;
  questionHtml: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
  prereqAtomId: string;
  prereqTitle: string;
  position: number;
  totalPrereqs: number;
};

export type ScanNextResult =
  | { done: false; question: ScanQuestionPayload }
  | { done: true; cooldown: boolean; scannedPrereqs: ScannedPrereq[] };

export type ScannedPrereq = { atomId: string; correct: boolean };

export type ScanAnswerResult = {
  responseId: string;
  isCorrect: boolean;
  correctAnswer: string;
  scanComplete: boolean;
  gapFound: boolean;
  gapAtomId: string | null;
  cooldown: boolean;
  scannedPrereqs: ScannedPrereq[];
};

/** Student must master N more atoms before retrying the failed atom */
export const COOLDOWN_MASTERY_COUNT = 3;

// ============================================================================
// HELPERS
// ============================================================================

async function getPrereqIds(atomId: string): Promise<string[]> {
  const [atom] = await db
    .select({ prerequisiteIds: atoms.prerequisiteIds })
    .from(atoms)
    .where(eq(atoms.id, atomId))
    .limit(1);
  if (!atom) throw new Error("Atom not found");
  return (atom.prerequisiteIds ?? []).filter(Boolean);
}

/**
 * Maps answered scan responses to their prereq atoms via
 * generated_questions join. Only includes answered responses.
 */
async function getTestedPrereqs(
  sessionId: string,
  prereqIds: string[]
): Promise<ScannedPrereq[]> {
  if (prereqIds.length === 0) return [];
  const rows = await db
    .select({
      atomId: generatedQuestions.atomId,
      isCorrect: atomStudyResponses.isCorrect,
    })
    .from(atomStudyResponses)
    .innerJoin(
      generatedQuestions,
      eq(generatedQuestions.id, atomStudyResponses.questionId)
    )
    .where(
      and(
        eq(atomStudyResponses.sessionId, sessionId),
        inArray(generatedQuestions.atomId, prereqIds),
        sql`${atomStudyResponses.answeredAt} IS NOT NULL`
      )
    )
    .orderBy(asc(atomStudyResponses.position));

  const seen = new Set<string>();
  return rows.reduce<ScannedPrereq[]>((acc, r) => {
    if (!seen.has(r.atomId)) {
      seen.add(r.atomId);
      acc.push({ atomId: r.atomId, correct: r.isCorrect ?? false });
    }
    return acc;
  }, []);
}

/**
 * Finds one hard-or-medium generated question for a prereq atom.
 * Prefers hard; falls back to medium if no hard questions remain unseen.
 */
async function findScanQuestion(prereqAtomId: string, excludeIds: string[]) {
  const hard = await findGeneratedQuestions({
    atomId: prereqAtomId,
    difficulty: "high",
    excludeIds,
    limit: 1,
  });
  if (hard[0]) return { question: hard[0], difficulty: "hard" as const };

  const medium = await findGeneratedQuestions({
    atomId: prereqAtomId,
    difficulty: "medium",
    excludeIds,
    limit: 1,
  });
  if (medium[0]) return { question: medium[0], difficulty: "medium" as const };

  return null;
}

/** Halves the review interval for a mastered atom after SR failure with no gap. */
async function halveReviewInterval(userId: string, atomId: string) {
  await db
    .update(atomMastery)
    .set({
      reviewIntervalSessions: sql`GREATEST(1, FLOOR(
        ${atomMastery.reviewIntervalSessions} / 2
      ))`,
      sessionsSinceLastReview: 0,
      updatedAt: new Date(),
    })
    .where(and(eq(atomMastery.userId, userId), eq(atomMastery.atomId, atomId)));
}

/** Upserts cooldown on the failed atom's mastery row */
async function setCooldown(userId: string, failedAtomId: string) {
  await db
    .insert(atomMastery)
    .values({
      userId,
      atomId: failedAtomId,
      status: "in_progress",
      isMastered: false,
      cooldownUntilMasteryCount: COOLDOWN_MASTERY_COUNT,
    })
    .onConflictDoUpdate({
      target: [atomMastery.userId, atomMastery.atomId],
      set: {
        cooldownUntilMasteryCount: COOLDOWN_MASTERY_COUNT,
        updatedAt: new Date(),
      },
    });
}

async function completeScanSession(sessionId: string) {
  await db
    .update(atomStudySessions)
    .set({ completedAt: new Date() })
    .where(eq(atomStudySessions.id, sessionId));
}

// ============================================================================
// PUBLIC API
// ============================================================================

/** Starts (or resumes) a prerequisite scan after a mastery failure. */
export async function startPrereqScan(
  userId: string,
  failedAtomId: string
): Promise<ScanStartResult> {
  const prereqIds = await getPrereqIds(failedAtomId);

  if (prereqIds.length === 0) {
    await setCooldown(userId, failedAtomId);
    return { sessionId: null, prereqCount: 0, status: "no_prereqs" };
  }

  const [active] = await db
    .select({ id: atomStudySessions.id })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.atomId, failedAtomId),
        eq(atomStudySessions.sessionType, "prereq_scan"),
        sql`${atomStudySessions.completedAt} IS NULL`
      )
    )
    .limit(1);

  if (active) {
    return {
      sessionId: active.id,
      prereqCount: prereqIds.length,
      status: "in_progress",
    };
  }

  const [session] = await db
    .insert(atomStudySessions)
    .values({
      userId,
      atomId: failedAtomId,
      sessionType: "prereq_scan",
      attemptNumber: 1,
      status: "in_progress",
      currentDifficulty: "hard",
    })
    .returning({ id: atomStudySessions.id });

  return {
    sessionId: session.id,
    prereqCount: prereqIds.length,
    status: "in_progress",
  };
}

/**
 * Serves the next scan question.
 * If no untested prereqs remain (all answered or all lack hard questions),
 * applies cooldown and completes the session.
 */
export async function getNextScanQuestion(
  sessionId: string,
  userId: string
): Promise<ScanNextResult> {
  const session = await verifySessionOwnership(sessionId, userId);
  if (!session) throw new Error("Session not found");
  if (session.sessionType !== "prereq_scan") {
    throw new Error("Not a prereq scan session");
  }

  const prereqIds = await getPrereqIds(session.atomId);

  // Preload titles + tested prereqs in parallel to avoid per-iteration DB hits
  const [tested, prereqTitleRows] = await Promise.all([
    getTestedPrereqs(sessionId, prereqIds),
    prereqIds.length > 0
      ? db
          .select({ id: atoms.id, title: atoms.title })
          .from(atoms)
          .where(inArray(atoms.id, prereqIds))
      : Promise.resolve([]),
  ]);
  const testedSet = new Set(tested.map((t) => t.atomId));
  const titleMap = new Map(prereqTitleRows.map((r) => [r.id, r.title]));

  for (const prereqId of prereqIds) {
    if (testedSet.has(prereqId)) continue;

    const seenIds = await getSeenQuestionIds(userId, prereqId);
    const result = await findScanQuestion(prereqId, seenIds);
    if (!result) continue;

    const { question: q, difficulty } = result;

    const parsed = parseQtiXml(q.qtiXml);
    const position = tested.length + 1;

    const [response] = await db
      .insert(atomStudyResponses)
      .values({
        sessionId,
        questionId: q.id,
        position,
        difficultyLevel: difficulty,
      })
      .returning({ id: atomStudyResponses.id });

    return {
      done: false,
      question: {
        responseId: response.id,
        questionHtml: parsed.html,
        options: parsed.options,
        prereqAtomId: prereqId,
        prereqTitle: titleMap.get(prereqId) ?? prereqId,
        position,
        totalPrereqs: prereqIds.length,
      },
    };
  }

  // All prereqs tested or skipped — no gap found.
  // Behavior depends on whether the atom is mastered (SR failure)
  // or not mastered (mastery failure).
  const [mastery] = await db
    .select({ isMastered: atomMastery.isMastered })
    .from(atomMastery)
    .where(
      and(
        eq(atomMastery.userId, userId),
        eq(atomMastery.atomId, session.atomId)
      )
    )
    .limit(1);

  if (mastery?.isMastered) {
    // SR review failure: atom is still mastered — halve interval (spec 7.9)
    await halveReviewInterval(userId, session.atomId);
  } else {
    // Mastery failure: atom not mastered — apply cooldown (spec 6)
    await setCooldown(userId, session.atomId);
  }

  await completeScanSession(sessionId);
  const scannedPrereqs = await getTestedPrereqs(sessionId, prereqIds);
  return { done: true, cooldown: !mastery?.isMastered, scannedPrereqs };
}

/**
 * Grades a scan answer.
 * Incorrect → marks the prereq as the gap, completes the scan.
 * Correct   → returns scanComplete: false; caller should request next question.
 */
export async function submitScanAnswer(params: {
  sessionId: string;
  responseId: string;
  selectedAnswer: string;
  userId: string;
}): Promise<ScanAnswerResult> {
  const session = await verifySessionOwnership(params.sessionId, params.userId);
  if (!session) throw new Error("Session not found");

  const [resp] = await db
    .select({
      id: atomStudyResponses.id,
      questionId: atomStudyResponses.questionId,
    })
    .from(atomStudyResponses)
    .where(
      and(
        eq(atomStudyResponses.id, params.responseId),
        eq(atomStudyResponses.sessionId, params.sessionId)
      )
    )
    .limit(1);
  if (!resp) throw new Error("Response not found");

  const question = await getQuestionContent(resp.questionId);
  if (!question) throw new Error("Question not found");

  const parsed = parseQtiXml(question.qtiXml);
  const correctAnswer = parsed.correctAnswer
    ? normalizeAnswer(parsed.correctAnswer)
    : null;
  if (!correctAnswer) throw new Error("No valid correct answer");

  const normalized = normalizeAnswer(params.selectedAnswer);
  const isCorrect = normalized === correctAnswer;

  await db
    .update(atomStudyResponses)
    .set({ selectedAnswer: normalized, isCorrect, answeredAt: new Date() })
    .where(eq(atomStudyResponses.id, resp.id));

  const prereqIds = await getPrereqIds(session.atomId);
  const scannedPrereqs = await getTestedPrereqs(params.sessionId, prereqIds);

  if (!isCorrect) {
    const questionAtomId = await getQuestionAtomId(resp.questionId);
    const gapAtomId =
      questionAtomId && prereqIds.includes(questionAtomId)
        ? questionAtomId
        : null;

    if (gapAtomId) {
      await db
        .insert(atomMastery)
        .values({
          userId: params.userId,
          atomId: gapAtomId,
          status: "in_progress",
          isMastered: false,
        })
        .onConflictDoUpdate({
          target: [atomMastery.userId, atomMastery.atomId],
          set: {
            status: "in_progress",
            isMastered: false,
            updatedAt: new Date(),
          },
        });
    }

    await completeScanSession(params.sessionId);
    return {
      responseId: params.responseId,
      isCorrect: false,
      correctAnswer,
      scanComplete: true,
      gapFound: true,
      gapAtomId,
      cooldown: false,
      scannedPrereqs,
    };
  }

  return {
    responseId: params.responseId,
    isCorrect: true,
    correctAnswer,
    scanComplete: false,
    gapFound: false,
    gapAtomId: null,
    cooldown: false,
    scannedPrereqs,
  };
}

/**
 * Decrements cooldownUntilMasteryCount for every atom in cooldown for this
 * user. Called after mastering any atom — count reaching 0 exits cooldown.
 */
export async function checkCooldownExpiry(
  userId: string,
  _justMasteredAtomId: string
): Promise<void> {
  await db
    .update(atomMastery)
    .set({
      cooldownUntilMasteryCount: sql`
        ${atomMastery.cooldownUntilMasteryCount} - 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(atomMastery.userId, userId),
        sql`${atomMastery.cooldownUntilMasteryCount} > 0`
      )
    );
}
