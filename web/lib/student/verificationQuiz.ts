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

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atomStudySessions,
  atomStudyResponses,
  atoms,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/qti/serverParser";
import {
  findGeneratedQuestions,
  getSeenQuestionIds,
  normalizeAnswer,
} from "./questionQueries";
import { startPrereqScan } from "./prerequisiteScan";

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

/** Returns atoms in `needs_verification` status for a user. */
export async function getVerificationDueItems(
  userId: string
): Promise<VerificationDueItem[]> {
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
        eq(atomMastery.status, "needs_verification")
      )
    );

  return rows.map((r) => ({
    atomId: r.atomId,
    atomTitle: r.atomTitle,
  }));
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

  const items: VerificationSessionItem[] = [];
  for (let i = 0; i < dueItems.length; i++) {
    const due = dueItems[i];
    const seenIds = await getSeenQuestionIds(userId, due.atomId);
    const q = await findHardQuestion(due.atomId, seenIds);
    if (!q) continue;

    const parsed = parseQtiXml(q.qtiXml);
    const [response] = await db
      .insert(atomStudyResponses)
      .values({
        sessionId: session.id,
        questionId: q.id,
        position: i + 1,
        difficultyLevel: "hard",
      })
      .returning({ id: atomStudyResponses.id });

    items.push({
      responseId: response.id,
      atomId: due.atomId,
      atomTitle: due.atomTitle,
      questionHtml: parsed.html,
      options: parsed.options,
    });
  }

  if (items.length === 0) {
    await db
      .update(atomStudySessions)
      .set({ status: "abandoned", completedAt: new Date() })
      .where(eq(atomStudySessions.id, session.id));
    return null;
  }

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

  const qRows = await findGeneratedQuestions({
    atomId: "",
    difficulty: "high",
    limit: 0,
  });
  void qRows;

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
    await db
      .update(atomMastery)
      .set({
        status: "mastered",
        sessionsSinceLastReview: 0,
        lastDemonstratedAt: now,
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

async function findHardQuestion(atomId: string, excludeIds: string[]) {
  const rows = await findGeneratedQuestions({
    atomId,
    difficulty: "high",
    excludeIds,
    limit: 1,
  });
  return rows[0] ?? null;
}

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
