/**
 * Verification Quiz Engine — quick checks for full-test discrepancies.
 *
 * When a student gets a question wrong on atoms they had mastered, those
 * atoms are flagged as `needs_verification`. This engine creates a short
 * session (1 hard question per atom) to determine whether it was a
 * careless mistake or a real knowledge gap.
 *
 * On correct: restore `mastered` + credit spaced repetition.
 * On incorrect: downgrade to `in_progress` + trigger prereq scan.
 */

import { and, eq, sql, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atomStudySessions,
  atomStudyResponses,
  atoms,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/qti/serverParser";
import {
  getBatchSeenQuestionIds,
  findBatchReviewQuestions,
  normalizeAnswer,
} from "./questionQueries";
import { startPrereqScan } from "./prerequisiteScan";
import { computeGrowthFactor } from "./spacedRepetition";

/**
 * Hours after flagging before verification becomes active.
 * Ensures at least one sleep-consolidation cycle so results
 * distinguish careless mistakes from real gaps (spacing effect).
 */
const VERIFICATION_GRACE_HOURS = 24;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerificationDueItem = {
  atomId: string;
  atomTitle: string;
};

export type VerificationSession = {
  sessionId: string;
  items: VerificationSessionItem[];
};

export type VerificationSessionItem = {
  responseId: string;
  atomId: string;
  atomTitle: string;
  questionHtml: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
};

export type VerificationAnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  atomId: string;
  /** true when all verification items have been answered */
  sessionComplete: boolean;
  /** Set when incorrect — prereq scan started */
  prereqScan?: { sessionId: string } | null;
};

export type VerificationCompletionResult = {
  restored: number;
  downgraded: number;
  downgradedAtomIds: string[];
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns atoms in `needs_verification` status for a user,
 * excluding those still within the post-test grace period.
 */
export async function getVerificationDueItems(
  userId: string
): Promise<VerificationDueItem[]> {
  const graceCutoff = new Date(
    Date.now() - VERIFICATION_GRACE_HOURS * 60 * 60 * 1000
  );

  const rows = await db
    .select({
      atomId: atomMastery.atomId,
      atomTitle: atoms.title,
    })
    .from(atomMastery)
    .innerJoin(atoms, eq(atoms.id, atomMastery.atomId))
    .where(
      and(
        eq(atomMastery.userId, userId),
        eq(atomMastery.status, "needs_verification"),
        lt(atomMastery.updatedAt, graceCutoff)
      )
    );

  return rows.map((r) => ({
    atomId: r.atomId,
    atomTitle: r.atomTitle,
  }));
}

/**
 * Lightweight check: returns true if the student has any verification-due
 * atoms past the grace period. Use to gate study/review routes.
 */
export async function hasVerificationDue(
  userId: string
): Promise<boolean> {
  const graceCutoff = new Date(
    Date.now() - VERIFICATION_GRACE_HOURS * 60 * 60 * 1000
  );

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atomMastery)
    .where(
      and(
        eq(atomMastery.userId, userId),
        eq(atomMastery.status, "needs_verification"),
        lt(atomMastery.updatedAt, graceCutoff)
      )
    );

  return Number(row?.count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Session creation
// ---------------------------------------------------------------------------

/**
 * Creates a verification session with 1 hard question per
 * `needs_verification` atom. Returns null if nothing is due.
 */
export async function createVerificationSession(
  userId: string
): Promise<VerificationSession | null> {
  const dueItems = await getVerificationDueItems(userId);
  if (dueItems.length === 0) return null;

  const [session] = await db
    .insert(atomStudySessions)
    .values({
      userId,
      atomId: dueItems[0].atomId,
      sessionType: "verification",
      attemptNumber: 1,
      status: "in_progress",
      currentDifficulty: "hard",
    })
    .returning({ id: atomStudySessions.id });

  const atomIds = dueItems.map((d) => d.atomId);
  const seenMap = await getBatchSeenQuestionIds(userId, atomIds);
  const questionsWithExclusions =
    await findBatchReviewQuestions(atomIds, seenMap);

  // Build insertable rows, skipping atoms with no available question
  const insertRows: {
    due: VerificationDueItem;
    question: { id: string; qtiXml: string };
    position: number;
  }[] = [];
  let pos = 0;
  for (const due of dueItems) {
    const q = questionsWithExclusions.get(due.atomId);
    if (!q) continue;
    pos++;
    insertRows.push({ due, question: q, position: pos });
  }

  if (insertRows.length === 0) {
    await db
      .update(atomStudySessions)
      .set({ status: "abandoned", completedAt: new Date() })
      .where(eq(atomStudySessions.id, session.id));
    return null;
  }

  // Batch insert all responses in a single query
  const responses = await db
    .insert(atomStudyResponses)
    .values(
      insertRows.map((r) => ({
        sessionId: session.id,
        questionId: r.question.id,
        position: r.position,
        difficultyLevel: "hard" as const,
      }))
    )
    .returning({ id: atomStudyResponses.id });

  const items: VerificationSessionItem[] = insertRows.map((r, i) => {
    const parsed = parseQtiXml(r.question.qtiXml);
    return {
      responseId: responses[i].id,
      atomId: r.due.atomId,
      atomTitle: r.due.atomTitle,
      questionHtml: parsed.html,
      options: parsed.options,
    };
  });

  return { sessionId: session.id, items };
}

// ---------------------------------------------------------------------------
// Answer submission
// ---------------------------------------------------------------------------

/**
 * Grades a verification answer. Immediately updates mastery:
 * - Correct → restore `mastered`, reset SR counters
 * - Incorrect → set `in_progress`, trigger prereq scan
 */
export async function submitVerificationAnswer(params: {
  sessionId: string;
  responseId: string;
  selectedAnswer: string;
  userId: string;
}): Promise<VerificationAnswerResult> {
  const [resp] = await db
    .select({
      id: atomStudyResponses.id,
      questionId: atomStudyResponses.questionId,
      isCorrect: atomStudyResponses.isCorrect,
    })
    .from(atomStudyResponses)
    .where(
      and(
        eq(atomStudyResponses.id, params.responseId),
        eq(atomStudyResponses.sessionId, params.sessionId)
      )
    );

  if (!resp) throw new Error("Verification response not found");
  if (resp.isCorrect !== null) {
    throw new Error("Verification answer already submitted");
  }

  const [qRow] = await db
    .select({ qtiXml: sql<string>`qti_xml` })
    .from(sql`generated_questions`)
    .where(sql`id = ${resp.questionId}`)
    .limit(1);

  if (!qRow) throw new Error("Question not found");

  const parsed = parseQtiXml(qRow.qtiXml);
  const correctRaw = parsed.correctAnswer ?? "";
  const correctAnswer = normalizeAnswer(correctRaw);
  const studentAnswer = normalizeAnswer(params.selectedAnswer);
  const isCorrect = studentAnswer === correctAnswer;

  const atomId = await getResponseAtomId(params.responseId);

  await db
    .update(atomStudyResponses)
    .set({
      selectedAnswer: studentAnswer,
      isCorrect,
      answeredAt: new Date(),
    })
    .where(eq(atomStudyResponses.id, params.responseId));

  const now = new Date();
  let prereqScan: { sessionId: string } | null = null;

  if (isCorrect) {
    // Verification counts as spaced repetition: advance the SR interval
    const [mastery] = await db
      .select({
        reviewIntervalSessions: atomMastery.reviewIntervalSessions,
        correctAttempts: atomMastery.correctAttempts,
        totalAttempts: atomMastery.totalAttempts,
        totalReviews: atomMastery.totalReviews,
      })
      .from(atomMastery)
      .where(
        and(
          eq(atomMastery.userId, params.userId),
          eq(atomMastery.atomId, atomId)
        )
      )
      .limit(1);

    const curInterval = mastery?.reviewIntervalSessions ?? 3;
    const factor = computeGrowthFactor(
      mastery?.correctAttempts ?? 0,
      mastery?.totalAttempts ?? 0
    );
    const newInterval = Math.round(curInterval * factor);
    const calendarHintMs = newInterval * 2 * 24 * 60 * 60 * 1000;

    await db
      .update(atomMastery)
      .set({
        status: "mastered",
        sessionsSinceLastReview: 0,
        reviewIntervalSessions: newInterval,
        totalReviews: (mastery?.totalReviews ?? 0) + 1,
        lastDemonstratedAt: now,
        nextReviewAt: new Date(Date.now() + calendarHintMs),
        updatedAt: now,
      })
      .where(
        and(
          eq(atomMastery.userId, params.userId),
          eq(atomMastery.atomId, atomId),
          eq(atomMastery.status, "needs_verification")
        )
      );
  } else {
    await db
      .update(atomMastery)
      .set({
        status: "in_progress",
        isMastered: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(atomMastery.userId, params.userId),
          eq(atomMastery.atomId, atomId),
          eq(atomMastery.status, "needs_verification")
        )
      );

    const scanResult = await startPrereqScan(params.userId, atomId);
    if (scanResult?.sessionId) {
      prereqScan = { sessionId: scanResult.sessionId };
    }
  }

  const sessionComplete = await isSessionFullyAnswered(params.sessionId);
  if (sessionComplete) {
    await db
      .update(atomStudySessions)
      .set({ status: "mastered", completedAt: new Date() })
      .where(eq(atomStudySessions.id, params.sessionId));
  }

  return {
    isCorrect,
    correctAnswer,
    atomId,
    sessionComplete,
    prereqScan,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getResponseAtomId(responseId: string): Promise<string> {
  const [row] = await db
    .select({ questionId: atomStudyResponses.questionId })
    .from(atomStudyResponses)
    .where(eq(atomStudyResponses.id, responseId))
    .limit(1);

  if (!row) throw new Error("Response not found");

  const [qRow] = await db
    .select({ atomId: sql<string>`atom_id` })
    .from(sql`generated_questions`)
    .where(sql`id = ${row.questionId}`)
    .limit(1);

  if (!qRow) throw new Error("Question not found");
  return qRow.atomId;
}

async function isSessionFullyAnswered(sessionId: string): Promise<boolean> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      answered: sql<number>`count(*) FILTER (WHERE is_correct IS NOT NULL)`,
    })
    .from(atomStudyResponses)
    .where(eq(atomStudyResponses.sessionId, sessionId));

  return row.total > 0 && row.total === row.answered;
}
