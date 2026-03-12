/**
 * Full Test Scoring — PAES score recalibration after completing a full test.
 *
 * Extracted from fullTest.ts to keep files under 500 lines.
 * Handles: score lookup, confidence band, mastery upserts, SR credit,
 * and flagging mastery discrepancies for verification.
 */

import { and, eq, sql, inArray } from "drizzle-orm";
import { db } from "@/db";

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
import {
  testAttempts,
  questionAtoms,
  atomMastery,
  users,
} from "@/db/schema";
import { getPaesScore } from "@/lib/diagnostic/paesScoreTable";
import { getLevel } from "@/lib/diagnostic/config";

// ============================================================================
// TYPES
// ============================================================================

export type RecalibrateParams = {
  userId: string;
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: {
    originalQuestionId: string;
    isCorrect: boolean;
  }[];
};

export type RecalibrateResult = {
  paesScore: number;
  paesScoreMin: number;
  paesScoreMax: number;
  level: string;
};

// ============================================================================
// SCORE RECALIBRATION
// ============================================================================

/**
 * Recalibrates the student's PAES score after completing a full test.
 *
 * Steps:
 * 1. Direct table lookup for PAES score
 * 2. Confidence band ±2 questions (narrower than diagnostic's ±5)
 * 3. Update test_attempts and users rows
 * 4. Upsert atom_mastery for correctly-answered questions
 */
export async function recalibrateScore(
  params: RecalibrateParams
): Promise<RecalibrateResult> {
  const {
    userId,
    attemptId,
    correctAnswers,
    totalQuestions,
    answeredQuestions,
  } = params;

  const paesScore = getPaesScore(correctAnswers);
  const minCorrect = Math.max(0, correctAnswers - 2);
  const maxCorrect = Math.min(60, correctAnswers + 2);
  const paesScoreMin = getPaesScore(minCorrect);
  const paesScoreMax = getPaesScore(maxCorrect);
  const level = getLevel(paesScore);

  const scorePercentage =
    totalQuestions > 0
      ? ((correctAnswers / totalQuestions) * 100).toFixed(2)
      : "0";

  await db.transaction(async (tx) => {
    await updateTestAttempt(tx, attemptId, userId, {
      correctAnswers,
      scorePercentage,
      paesScoreMin,
      paesScoreMax,
    });
    await updateUserScores(tx, userId, paesScoreMin, paesScoreMax);
    await upsertMasteryFromCorrectAnswers(tx, userId, answeredQuestions);
    await creditSpacedRepetitionFromTest(tx, userId, answeredQuestions);
    await flagMasteryDiscrepancies(tx, userId, answeredQuestions);
  });

  return { paesScore, paesScoreMin, paesScoreMax, level };
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

async function updateTestAttempt(
  tx: TxClient,
  attemptId: string,
  userId: string,
  data: {
    correctAnswers: number;
    scorePercentage: string;
    paesScoreMin: number;
    paesScoreMax: number;
  }
) {
  await tx
    .update(testAttempts)
    .set({
      correctAnswers: data.correctAnswers,
      scorePercentage: data.scorePercentage,
      paesScoreMin: data.paesScoreMin,
      paesScoreMax: data.paesScoreMax,
      completedAt: new Date(),
    })
    .where(
      and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId))
    );
}

async function updateUserScores(
  tx: TxClient,
  userId: string,
  paesScoreMin: number,
  paesScoreMax: number
) {
  await tx
    .update(users)
    .set({ paesScoreMin, paesScoreMax })
    .where(eq(users.id, userId));
}

/**
 * For each correctly-answered question, upsert atom_mastery for primary atoms.
 * Only marks as mastered if not already mastered.
 */
async function upsertMasteryFromCorrectAnswers(
  tx: TxClient,
  userId: string,
  answeredQuestions: RecalibrateParams["answeredQuestions"]
) {
  const correctOriginals = answeredQuestions
    .filter((q) => q.isCorrect)
    .map((q) => q.originalQuestionId);

  if (correctOriginals.length === 0) return;

  const primaryAtoms = await tx
    .select({
      questionId: questionAtoms.questionId,
      atomId: questionAtoms.atomId,
    })
    .from(questionAtoms)
    .where(
      and(
        inArray(questionAtoms.questionId, correctOriginals),
        eq(questionAtoms.relevance, "primary")
      )
    );

  const now = new Date();
  const nowIso = now.toISOString();
  for (const { atomId } of primaryAtoms) {
    await tx
      .insert(atomMastery)
      .values({
        userId,
        atomId,
        isMastered: true,
        masterySource: "practice_test",
        firstMasteredAt: now,
        status: "mastered",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [atomMastery.userId, atomMastery.atomId],
        set: {
          isMastered: true,
          masterySource: sql`CASE
            WHEN ${atomMastery.isMastered} = true
            THEN ${atomMastery.masterySource}
            ELSE 'practice_test'
          END`,
          firstMasteredAt: sql`COALESCE(
            ${atomMastery.firstMasteredAt},
            ${nowIso}::timestamptz
          )`,
          status: "mastered",
          updatedAt: now,
        },
      });
  }
}

/** Extracts unique primary atom IDs for a set of question IDs. */
async function getPrimaryAtomIds(
  tx: TxClient,
  questionIds: string[]
): Promise<string[]> {
  if (questionIds.length === 0) return [];
  const rows = await tx
    .select({ atomId: questionAtoms.atomId })
    .from(questionAtoms)
    .where(
      and(
        inArray(questionAtoms.questionId, questionIds),
        eq(questionAtoms.relevance, "primary")
      )
    );
  return [...new Set(rows.map((r) => r.atomId))];
}

/**
 * For correct answers on atoms that were ALREADY mastered, reset SR counters.
 * A full test is high-quality evidence of retention — credit it accordingly.
 */
async function creditSpacedRepetitionFromTest(
  tx: TxClient,
  userId: string,
  answeredQuestions: RecalibrateParams["answeredQuestions"]
) {
  const correctQIds = answeredQuestions
    .filter((q) => q.isCorrect)
    .map((q) => q.originalQuestionId);
  const atomIds = await getPrimaryAtomIds(tx, correctQIds);
  if (atomIds.length === 0) return;

  const now = new Date();
  const BOOST = 1.5;
  for (const atomId of atomIds) {
    await tx
      .update(atomMastery)
      .set({
        sessionsSinceLastReview: 0,
        lastDemonstratedAt: now,
        reviewIntervalSessions: sql`CASE
          WHEN ${atomMastery.reviewIntervalSessions} IS NOT NULL
          THEN LEAST(CEIL(${atomMastery.reviewIntervalSessions} * ${BOOST}), 20)
          ELSE ${atomMastery.reviewIntervalSessions}
        END`,
        nextReviewAt: sql`CASE
          WHEN ${atomMastery.reviewIntervalSessions} IS NOT NULL
          THEN NOW() + (LEAST(CEIL(${atomMastery.reviewIntervalSessions} * ${BOOST}), 20) * INTERVAL '2 days')
          ELSE ${atomMastery.nextReviewAt}
        END`,
        updatedAt: now,
      })
      .where(
        and(
          eq(atomMastery.userId, userId),
          eq(atomMastery.atomId, atomId),
          eq(atomMastery.isMastered, true)
        )
      );
  }
}

/**
 * For wrong answers whose primary atoms are currently mastered,
 * flag them as needs_verification. The verification quiz engine
 * will surface a quick check in the student's next study session.
 */
async function flagMasteryDiscrepancies(
  tx: TxClient,
  userId: string,
  answeredQuestions: RecalibrateParams["answeredQuestions"]
) {
  const wrongQIds = answeredQuestions
    .filter((q) => !q.isCorrect)
    .map((q) => q.originalQuestionId);
  const atomIds = await getPrimaryAtomIds(tx, wrongQIds);
  if (atomIds.length === 0) return;

  const now = new Date();
  for (const atomId of atomIds) {
    await tx
      .update(atomMastery)
      .set({ status: "needs_verification", updatedAt: now })
      .where(
        and(
          eq(atomMastery.userId, userId),
          eq(atomMastery.atomId, atomId),
          eq(atomMastery.isMastered, true),
          eq(atomMastery.status, "mastered")
        )
      );
  }
}
