/**
 * Activity-based Spaced Repetition Engine — review scheduling by sessions,
 * not calendar days. Intervals grow on success and shrink on failure.
 */

import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atomStudyResponses,
  atomStudySessions,
  atoms,
  generatedQuestions,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/qti/serverParser";
import { startPrereqScan } from "./prerequisiteScan";
import {
  findGeneratedQuestions,
  getQuestionAtomId,
  getQuestionContent,
  getSeenQuestionIds,
  normalizeAnswer,
} from "./questionQueries";

export type MasteryQuality = "high" | "medium" | "low";

export type ReviewDueItem = {
  atomId: string;
  atomTitle: string;
  reviewIntervalSessions: number;
  sessionsSinceLastReview: number;
  overdueBy: number;
};

export type ReviewSession = {
  sessionId: string;
  items: Array<{
    responseId: string;
    atomId: string;
    atomTitle: string;
    questionHtml: string;
    options: Array<{ letter: string; text: string; identifier: string }>;
  }>;
};

export type ReviewAnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  atomId: string;
};

export type ReviewCompletionResult = {
  passed: number;
  failed: number;
  failedAtomIds: string[];
};

export type ReviewFailureResult = {
  halvedIntervals: Array<{ atomId: string; newInterval: number }>;
  pendingScans: Array<{ atomId: string; scanSessionId: string }>;
};

function computeInitialInterval(quality: MasteryQuality): number {
  if (quality === "high") return 5;
  if (quality === "medium") return 3;
  return 2;
}

export function determineMasteryQuality(
  totalQuestions: number,
  accuracy: number
): MasteryQuality {
  if (totalQuestions <= 10 && accuracy > 0.85) return "high";
  if (totalQuestions <= 17 && accuracy >= 0.7) return "medium";
  return "low";
}

/** Growth factor between 1.5–2.5 based on overall accuracy history */
function computeGrowthFactor(correct: number, total: number): number {
  if (total === 0) return 2.0;
  const acc = correct / total;
  if (acc > 0.85) return 2.5;
  if (acc > 0.7) return 2.0;
  return 1.5;
}

/** Finds one hard generated question for an atom */
async function findReviewQuestion(atomId: string, excludeIds: string[]) {
  const rows = await findGeneratedQuestions({
    atomId,
    difficulty: "high",
    excludeIds,
    limit: 1,
  });
  return rows[0] ?? null;
}

/** Builds a WHERE clause targeting a user+atom in atomMastery */
function masteryWhere(userId: string, atomId: string) {
  return and(eq(atomMastery.userId, userId), eq(atomMastery.atomId, atomId));
}

/** Sets the initial review schedule after mastery is achieved. */
export async function initializeReviewSchedule(
  userId: string,
  atomId: string,
  masteryQuality: MasteryQuality
) {
  const interval = computeInitialInterval(masteryQuality);
  const calendarHintMs = interval * 2 * 24 * 60 * 60 * 1000;
  await db
    .update(atomMastery)
    .set({
      reviewIntervalSessions: interval,
      sessionsSinceLastReview: 0,
      totalReviews: 0,
      nextReviewAt: new Date(Date.now() + calendarHintMs),
      updatedAt: new Date(),
    })
    .where(masteryWhere(userId, atomId));
}

/** Review budget based on recent study frequency. Hard cap: 5 items. */
export async function getSessionBudget(userId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        gte(atomStudySessions.startedAt, sevenDaysAgo),
        inArray(atomStudySessions.status, ["mastered", "failed"])
      )
    );
  const spw = Number(row?.count ?? 0);
  if (spw >= 3) return Math.min(5, Math.ceil(spw * 0.3));
  if (spw >= 1) return Math.min(5, Math.ceil(spw * 0.2));
  return 1;
}

/** Atoms due for review, sorted by urgency, capped at session budget. */
export async function getReviewDueItems(
  userId: string
): Promise<ReviewDueItem[]> {
  const budget = await getSessionBudget(userId);

  const sinceCol = atomMastery.sessionsSinceLastReview;
  const intCol = atomMastery.reviewIntervalSessions;
  const rows = await db
    .select({
      atomId: atomMastery.atomId,
      interval: intCol,
      since: sinceCol,
      atomTitle: atoms.title,
    })
    .from(atomMastery)
    .innerJoin(atoms, eq(atoms.id, atomMastery.atomId))
    .where(
      and(
        eq(atomMastery.userId, userId),
        eq(atomMastery.isMastered, true),
        sql`${intCol} IS NOT NULL`,
        sql`${sinceCol} >= ${intCol}`
      )
    )
    .orderBy(desc(sql`${sinceCol} - ${intCol}`), sql`${intCol} ASC`)
    .limit(budget);

  return rows.map((r) => ({
    atomId: r.atomId,
    atomTitle: r.atomTitle,
    reviewIntervalSessions: r.interval!,
    sessionsSinceLastReview: r.since ?? 0,
    overdueBy: (r.since ?? 0) - (r.interval ?? 0),
  }));
}

/** Creates a review session with one hard question per due atom. */
export async function createReviewSession(
  userId: string
): Promise<ReviewSession | null> {
  const dueItems = await getReviewDueItems(userId);
  if (dueItems.length === 0) return null;
  const [session] = await db
    .insert(atomStudySessions)
    .values({
      userId,
      atomId: dueItems[0].atomId,
      sessionType: "review",
      attemptNumber: 1,
      status: "in_progress",
      currentDifficulty: "hard",
    })
    .returning({ id: atomStudySessions.id });
  const items: ReviewSession["items"] = [];
  for (let i = 0; i < dueItems.length; i++) {
    const due = dueItems[i];
    const seenIds = await getSeenQuestionIds(userId, due.atomId);
    const q = await findReviewQuestion(due.atomId, seenIds);
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

/** Grades a review answer. Correct → extend interval; incorrect → mark fail. */
export async function submitReviewAnswer(params: {
  sessionId: string;
  responseId: string;
  selectedAnswer: string;
  userId: string;
}): Promise<ReviewAnswerResult> {
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

  const atomId = await getQuestionAtomId(resp.questionId);
  if (!atomId) throw new Error("Question not linked to an atom");
  const where = masteryWhere(params.userId, atomId);

  const [mastery] = await db
    .select({
      reviewIntervalSessions: atomMastery.reviewIntervalSessions,
      correctAttempts: atomMastery.correctAttempts,
      totalAttempts: atomMastery.totalAttempts,
      totalReviews: atomMastery.totalReviews,
    })
    .from(atomMastery)
    .where(where)
    .limit(1);

  if (isCorrect) {
    const cur = mastery?.reviewIntervalSessions ?? 3;
    const factor = computeGrowthFactor(
      mastery?.correctAttempts ?? 0,
      mastery?.totalAttempts ?? 0
    );
    await db
      .update(atomMastery)
      .set({
        reviewIntervalSessions: Math.round(cur * factor),
        sessionsSinceLastReview: 0,
        totalReviews: (mastery?.totalReviews ?? 0) + 1,
        lastReviewResult: "pass",
        lastDemonstratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(where);
  } else {
    await db
      .update(atomMastery)
      .set({ lastReviewResult: "fail", updatedAt: new Date() })
      .where(where);
  }
  return { isCorrect, correctAnswer, atomId };
}

/** Finalizes a review session. Returns results for downstream prereq scanning. */
export async function completeReviewSession(
  sessionId: string,
  userId: string
): Promise<ReviewCompletionResult> {
  await db
    .update(atomStudySessions)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(atomStudySessions.id, sessionId),
        eq(atomStudySessions.userId, userId)
      )
    );

  const responses = await db
    .select({
      isCorrect: atomStudyResponses.isCorrect,
      atomId: generatedQuestions.atomId,
    })
    .from(atomStudyResponses)
    .innerJoin(
      generatedQuestions,
      eq(generatedQuestions.id, atomStudyResponses.questionId)
    )
    .where(
      and(
        eq(atomStudyResponses.sessionId, sessionId),
        sql`${atomStudyResponses.answeredAt} IS NOT NULL`
      )
    );

  const seen = new Set<string>();
  const failedAtomIds: string[] = [];
  let passed = 0;
  for (const r of responses) {
    if (seen.has(r.atomId)) continue;
    seen.add(r.atomId);
    if (r.isCorrect) passed++;
    else failedAtomIds.push(r.atomId);
  }
  return { passed, failed: failedAtomIds.length, failedAtomIds };
}

/**
 * Triage failed review atoms: halve interval (no prereqs) or start scan.
 */
export async function handleReviewFailures(
  userId: string,
  failedAtomIds: string[]
): Promise<ReviewFailureResult> {
  const halvedIntervals: ReviewFailureResult["halvedIntervals"] = [];
  const pendingScans: ReviewFailureResult["pendingScans"] = [];

  for (const atomId of failedAtomIds) {
    const [atom] = await db
      .select({ prerequisiteIds: atoms.prerequisiteIds })
      .from(atoms)
      .where(eq(atoms.id, atomId))
      .limit(1);

    const hasPrereqs = (atom?.prerequisiteIds ?? []).filter(Boolean).length > 0;

    if (!hasPrereqs) {
      const [m] = await db
        .select({ interval: atomMastery.reviewIntervalSessions })
        .from(atomMastery)
        .where(masteryWhere(userId, atomId))
        .limit(1);
      const newInterval = Math.max(1, Math.floor((m?.interval ?? 3) / 2));
      await db
        .update(atomMastery)
        .set({
          reviewIntervalSessions: newInterval,
          sessionsSinceLastReview: 0,
          updatedAt: new Date(),
        })
        .where(masteryWhere(userId, atomId));
      halvedIntervals.push({ atomId, newInterval });
    } else {
      const scan = await startPrereqScan(userId, atomId);
      if (scan.sessionId) {
        pendingScans.push({ atomId, scanSessionId: scan.sessionId });
      }
    }
  }
  return { halvedIntervals, pendingScans };
}

/** Increments sessionsSinceLastReview for all mastered atoms. Call per session. */
export async function incrementSessionCounters(userId: string) {
  await db.execute(sql`
    UPDATE atom_mastery
    SET sessions_since_last_review = sessions_since_last_review + 1
    WHERE user_id = ${userId}
      AND is_mastered = true
      AND review_interval_sessions IS NOT NULL
  `);
}

/**
 * Implicit repetition: prereqs get partial review credit when an advanced
 * atom is mastered/reviewed.
 *   1-hop (direct prereqs): full credit (reset to 0)
 *   2-hop: half credit (reduce by 50%)
 *   3-hop: quarter credit (reduce by 25%)
 * Spec ref: Section 7.6
 */
export async function applyImplicitRepetition(userId: string, atomId: string) {
  const [atom] = await db
    .select({ prerequisiteIds: atoms.prerequisiteIds })
    .from(atoms)
    .where(eq(atoms.id, atomId))
    .limit(1);

  const hop1Ids = (atom?.prerequisiteIds ?? []).filter(Boolean);
  if (hop1Ids.length === 0) return;

  // 1-hop: full credit — reset sessions_since_last_review to 0
  await db
    .update(atomMastery)
    .set({ sessionsSinceLastReview: 0, updatedAt: new Date() })
    .where(
      and(
        eq(atomMastery.userId, userId),
        inArray(atomMastery.atomId, hop1Ids),
        eq(atomMastery.isMastered, true)
      )
    );

  const visited = new Set<string>([atomId, ...hop1Ids]);

  // 2-hop: collect prereqs of hop-1 atoms (excluding visited)
  const hop1Atoms = await db
    .select({ prerequisiteIds: atoms.prerequisiteIds })
    .from(atoms)
    .where(inArray(atoms.id, hop1Ids));
  const hop2Ids: string[] = [];
  for (const a of hop1Atoms) {
    for (const id of (a.prerequisiteIds ?? []).filter(Boolean)) {
      if (!visited.has(id)) {
        hop2Ids.push(id);
        visited.add(id);
      }
    }
  }

  // 2-hop: half credit — reduce by 50%
  for (const hop2Id of hop2Ids) {
    await db.execute(sql`
      UPDATE atom_mastery
      SET sessions_since_last_review = GREATEST(0,
        sessions_since_last_review
          - GREATEST(1, sessions_since_last_review / 2))
      WHERE user_id = ${userId}
        AND atom_id = ${hop2Id} AND is_mastered = true
    `);
  }

  // 3-hop: collect prereqs of hop-2 atoms (excluding visited)
  if (hop2Ids.length === 0) return;
  const hop2Atoms = await db
    .select({ prerequisiteIds: atoms.prerequisiteIds })
    .from(atoms)
    .where(inArray(atoms.id, hop2Ids));
  const hop3Ids: string[] = [];
  for (const a of hop2Atoms) {
    for (const id of (a.prerequisiteIds ?? []).filter(Boolean)) {
      if (!visited.has(id)) {
        hop3Ids.push(id);
        visited.add(id);
      }
    }
  }

  // 3-hop: quarter credit — reduce by 25%
  for (const hop3Id of hop3Ids) {
    await db.execute(sql`
      UPDATE atom_mastery
      SET sessions_since_last_review = GREATEST(0,
        sessions_since_last_review
          - GREATEST(1, sessions_since_last_review / 4))
      WHERE user_id = ${userId}
        AND atom_id = ${hop3Id} AND is_mastered = true
    `);
  }
}

/** Decays intervals after >14 days inactivity. 2%/day, floored at 50%. */
export async function applyInactivityDecay(userId: string) {
  const [lastSession] = await db
    .select({ startedAt: atomStudySessions.startedAt })
    .from(atomStudySessions)
    .where(eq(atomStudySessions.userId, userId))
    .orderBy(desc(atomStudySessions.startedAt))
    .limit(1);

  if (!lastSession?.startedAt) return;
  const daysSince = Math.floor(
    (Date.now() - lastSession.startedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince <= 14) return;
  const decayFactor = Math.max(0.5, 1 - (daysSince - 14) * 0.02);
  await db.execute(sql`
    UPDATE atom_mastery
    SET review_interval_sessions = GREATEST(1,
      ROUND(review_interval_sessions * ${decayFactor}))
    WHERE user_id = ${userId}
      AND is_mastered = true
      AND review_interval_sessions IS NOT NULL
  `);
}
