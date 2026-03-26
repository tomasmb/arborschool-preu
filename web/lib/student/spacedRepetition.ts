/**
 * Activity-based Spaced Repetition Engine — review scheduling by sessions,
 * not calendar days. Intervals grow on success and shrink on failure.
 */

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atomStudyResponses,
  atomStudySessions,
  atoms,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/qti/serverParser";
import { startPrereqScan } from "./prerequisiteScan";
import {
  findBatchReviewQuestions,
  findBatchReviewVariants,
  getBatchSeenQuestionIds,
  getQuestionAtomId,
  getQuestionContent,
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

/**
 * Fluency thresholds (seconds). Median response time above these caps
 * sturdiness downward — a slow-but-accurate student gets reviewed sooner.
 */
const FLUENCY_FAST_CEIL = 60;
const FLUENCY_MODERATE_CEIL = 120;

export function determineMasteryQuality(
  totalQuestions: number,
  accuracy: number,
  medianResponseTimeSec?: number | null
): MasteryQuality {
  let quality: MasteryQuality = "low";
  if (totalQuestions <= 10 && accuracy > 0.85) quality = "high";
  else if (totalQuestions <= 17 && accuracy >= 0.7) quality = "medium";

  if (medianResponseTimeSec == null) return quality;

  if (medianResponseTimeSec > FLUENCY_MODERATE_CEIL) return "low";
  if (medianResponseTimeSec > FLUENCY_FAST_CEIL && quality === "high") {
    return "medium";
  }
  return quality;
}

/** Growth factor between 1.5–2.5 based on overall accuracy history */
export function computeGrowthFactor(correct: number, total: number): number {
  if (total === 0) return 2.0;
  const acc = correct / total;
  if (acc > 0.85) return 2.5;
  if (acc > 0.7) return 2.0;
  return 1.5;
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

/**
 * Atoms due for review, sorted by urgency, capped at a dynamic budget
 * derived from the student's recent study frequency.
 *
 * Budget logic (inlined as CTE to avoid a separate round-trip):
 *   sessions_past_week >= 3 → CEIL(spw * 0.3), cap 5
 *   sessions_past_week >= 1 → CEIL(spw * 0.2), cap 5
 *   else                    → 1
 */
export async function getReviewDueItems(
  userId: string
): Promise<ReviewDueItem[]> {
  type DueRow = {
    atom_id: string;
    review_interval_sessions: number;
    sessions_since_last_review: number;
    title: string;
  };

  const rows = await db.execute<DueRow>(sql`
    WITH recent_sessions AS (
      SELECT count(*) AS spw
      FROM atom_study_sessions
      WHERE user_id = ${userId}
        AND started_at >= now() - interval '7 days'
        AND status IN ('mastered', 'failed')
    ),
    budget AS (
      SELECT LEAST(5, CASE
        WHEN spw >= 3 THEN CEIL(spw * 0.3)
        WHEN spw >= 1 THEN CEIL(spw * 0.2)
        ELSE 1
      END)::int AS b
      FROM recent_sessions
    )
    SELECT
      am.atom_id,
      am.review_interval_sessions,
      am.sessions_since_last_review,
      a.title
    FROM atom_mastery am
    JOIN atoms a ON a.id = am.atom_id
    WHERE am.user_id = ${userId}
      AND am.is_mastered = true
      AND am.review_interval_sessions IS NOT NULL
      AND am.sessions_since_last_review >= am.review_interval_sessions
    ORDER BY
      (am.sessions_since_last_review - am.review_interval_sessions) DESC,
      am.review_interval_sessions ASC
    LIMIT (SELECT b FROM budget)
  `);

  return (rows as unknown as DueRow[]).map((r) => ({
    atomId: r.atom_id,
    atomTitle: r.title,
    reviewIntervalSessions: r.review_interval_sessions,
    sessionsSinceLastReview: r.sessions_since_last_review ?? 0,
    overdueBy:
      (r.sessions_since_last_review ?? 0) - (r.review_interval_sessions ?? 0),
  }));
}

/**
 * Creates a review session with one question per due atom.
 * Tries PAES variant (alternate) questions first for exam-realistic context,
 * then falls back to AI-generated questions for atoms without eligible variants.
 */
export async function createReviewSession(
  userId: string
): Promise<ReviewSession | null> {
  const dueItems = await getReviewDueItems(userId);
  if (dueItems.length === 0) return null;

  const dueAtomIds = dueItems.map((d) => d.atomId);

  const [session, variantMap, seenMap] = await Promise.all([
    db
      .insert(atomStudySessions)
      .values({
        userId,
        atomId: dueItems[0].atomId,
        sessionType: "review",
        attemptNumber: 1,
        status: "in_progress",
        currentDifficulty: "hard",
      })
      .returning({ id: atomStudySessions.id })
      .then((rows) => rows[0]),
    findBatchReviewVariants(dueAtomIds, userId),
    getBatchSeenQuestionIds(userId, dueAtomIds),
  ]);

  // Atoms without a variant match fall back to generated questions
  const remainingAtomIds = dueAtomIds.filter((id) => !variantMap.has(id));
  const generatedMap =
    remainingAtomIds.length > 0
      ? await findBatchReviewQuestions(remainingAtomIds, seenMap)
      : new Map<string, { id: string; qtiXml: string }>();

  // Merge both maps: variant wins, generated is fallback
  const questionMap = new Map<string, { id: string; qtiXml: string }>();
  for (const [atomId, q] of variantMap) questionMap.set(atomId, q);
  for (const [atomId, q] of generatedMap) {
    if (!questionMap.has(atomId)) questionMap.set(atomId, q);
  }

  const validEntries: Array<{
    due: (typeof dueItems)[number];
    question: { id: string; qtiXml: string };
    parsed: ReturnType<typeof parseQtiXml>;
  }> = [];
  for (const due of dueItems) {
    const q = questionMap.get(due.atomId);
    if (!q) continue;
    validEntries.push({ due, question: q, parsed: parseQtiXml(q.qtiXml) });
  }

  if (validEntries.length === 0) {
    await db
      .update(atomStudySessions)
      .set({ status: "abandoned", completedAt: new Date() })
      .where(eq(atomStudySessions.id, session.id));
    return null;
  }

  const responses = await db
    .insert(atomStudyResponses)
    .values(
      validEntries.map((e, i) => ({
        sessionId: session.id,
        questionId: e.question.id,
        atomId: e.due.atomId,
        position: i + 1,
        difficultyLevel: "hard" as const,
      }))
    )
    .returning({ id: atomStudyResponses.id });

  const items: ReviewSession["items"] = validEntries.map((e, i) => ({
    responseId: responses[i].id,
    atomId: e.due.atomId,
    atomTitle: e.due.atomTitle,
    questionHtml: e.parsed.html,
    options: e.parsed.options,
  }));

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
      atomId: atomStudyResponses.atomId,
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

  // Use stored atomId when available, fall back to lookup for legacy rows
  const atomId = resp.atomId ?? (await getQuestionAtomId(resp.questionId));
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

  // Read atomId directly from the response row (supports both variant and
  // generated questions). Legacy rows without atomId are resolved via fallback.
  const responses = await db
    .select({
      isCorrect: atomStudyResponses.isCorrect,
      atomId: atomStudyResponses.atomId,
      questionId: atomStudyResponses.questionId,
    })
    .from(atomStudyResponses)
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
    const atomId = r.atomId ?? (await getQuestionAtomId(r.questionId));
    if (!atomId) continue;
    if (seen.has(atomId)) continue;
    seen.add(atomId);
    if (r.isCorrect) passed++;
    else failedAtomIds.push(atomId);
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
  if (failedAtomIds.length === 0)
    return { halvedIntervals: [], pendingScans: [] };

  const [atomRows, masteryRows] = await Promise.all([
    db
      .select({ id: atoms.id, prerequisiteIds: atoms.prerequisiteIds })
      .from(atoms)
      .where(inArray(atoms.id, failedAtomIds)),
    db
      .select({
        atomId: atomMastery.atomId,
        interval: atomMastery.reviewIntervalSessions,
      })
      .from(atomMastery)
      .where(
        and(
          eq(atomMastery.userId, userId),
          inArray(atomMastery.atomId, failedAtomIds)
        )
      ),
  ]);

  const prereqMap = new Map(atomRows.map((a) => [a.id, a.prerequisiteIds]));
  const intervalMap = new Map(masteryRows.map((m) => [m.atomId, m.interval]));

  const halvedIntervals: ReviewFailureResult["halvedIntervals"] = [];
  const pendingScans: ReviewFailureResult["pendingScans"] = [];
  const now = new Date();

  const noPrereqUpdates: Array<{ atomId: string; newInterval: number }> = [];

  for (const atomId of failedAtomIds) {
    const prereqs = (prereqMap.get(atomId) ?? []).filter(Boolean);
    if (prereqs.length === 0) {
      const cur = intervalMap.get(atomId) ?? 3;
      const newInterval = Math.max(1, Math.floor(cur / 2));
      noPrereqUpdates.push({ atomId, newInterval });
      halvedIntervals.push({ atomId, newInterval });
    } else {
      const scan = await startPrereqScan(userId, atomId);
      if (scan.sessionId) {
        pendingScans.push({ atomId, scanSessionId: scan.sessionId });
      }
    }
  }

  await Promise.all(
    noPrereqUpdates.map(({ atomId, newInterval }) =>
      db
        .update(atomMastery)
        .set({
          reviewIntervalSessions: newInterval,
          sessionsSinceLastReview: 0,
          updatedAt: now,
        })
        .where(masteryWhere(userId, atomId))
    )
  );

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

/** Collects next-hop prereq IDs, excluding already-visited nodes. */
async function collectNextHop(
  currentIds: string[],
  visited: Set<string>
): Promise<string[]> {
  if (currentIds.length === 0) return [];
  const rows = await db
    .select({ prerequisiteIds: atoms.prerequisiteIds })
    .from(atoms)
    .where(inArray(atoms.id, currentIds));
  const nextIds: string[] = [];
  for (const a of rows) {
    for (const id of (a.prerequisiteIds ?? []).filter(Boolean)) {
      if (!visited.has(id)) {
        nextIds.push(id);
        visited.add(id);
      }
    }
  }
  return nextIds;
}

/** Reduces sessions_since_last_review for a set of atoms by a divisor. */
async function reduceReviewCounter(
  userId: string,
  atomIds: string[],
  divisor: number
) {
  if (atomIds.length === 0) return;
  const idList = sql.join(
    atomIds.map((id) => sql`${id}`),
    sql`, `
  );
  await db.execute(sql`
    UPDATE atom_mastery
    SET sessions_since_last_review = GREATEST(0,
      sessions_since_last_review
        - GREATEST(1, sessions_since_last_review / ${divisor}))
    WHERE user_id = ${userId}
      AND atom_id IN (${idList}) AND is_mastered = true
  `);
}

/**
 * Implicit repetition: prereqs get partial review credit when an advanced
 * atom is mastered/reviewed. 1-hop: full, 2-hop: 50%, 3-hop: 25%.
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
  const hop2Ids = await collectNextHop(hop1Ids, visited);
  await reduceReviewCounter(userId, hop2Ids, 2);
  const hop3Ids = await collectNextHop(hop2Ids, visited);
  await reduceReviewCounter(userId, hop3Ids, 4);
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
