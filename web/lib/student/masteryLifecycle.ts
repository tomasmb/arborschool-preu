/**
 * Post-mastery lifecycle helpers — enrichment data computed after a student
 * masters an atom (unlocked questions, next atom suggestion) and in-session
 * habit guard evaluation.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { atomMastery, atoms, questions as questionsTable } from "@/db/schema";
import {
  evaluateSessionFatigue,
  getDailyMasteryCount,
  type HabitGuardSignal,
} from "./habitGuard";
import { getReviewDueItems } from "./spacedRepetition";

/** Total count of official questions in the pool (for normalization). */
export async function getTotalOfficialQuestionCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionsTable)
    .where(eq(questionsTable.source, "official"));
  return Number(row?.count ?? 0);
}

/**
 * Counts PAES questions that just became fully answerable because atomId
 * was the last missing primary atom for the student.
 */
export async function countNewlyUnlockedQuestions(
  userId: string,
  atomId: string
): Promise<number> {
  const rows = await db.execute<{ count: string }>(sql`
    SELECT COUNT(DISTINCT qa.question_id) AS count
    FROM question_atoms qa
    WHERE qa.atom_id = ${atomId}
      AND qa.relevance = 'primary'
      AND NOT EXISTS (
        SELECT 1
        FROM question_atoms qa2
        LEFT JOIN atom_mastery am
          ON am.atom_id = qa2.atom_id AND am.user_id = ${userId}
        WHERE qa2.question_id = qa.question_id
          AND qa2.relevance = 'primary'
          AND (am.is_mastered IS NULL OR am.is_mastered = false)
      )
  `);
  return Number(rows[0]?.count ?? 0);
}

/**
 * Returns the next unmastered atom that shares a learning axis with the
 * just-mastered atom (lightweight alternative to full next-action analysis).
 */
export async function getNextStudyAtom(
  userId: string,
  justMasteredAtomId: string
): Promise<{ id: string; title: string } | null> {
  const [current] = await db
    .select({ subjectId: atoms.subjectId })
    .from(atoms)
    .where(eq(atoms.id, justMasteredAtomId))
    .limit(1);

  if (!current?.subjectId) return null;

  const masteryRows = await db
    .select({
      atomId: atomMastery.atomId,
      isMastered: atomMastery.isMastered,
      cooldown: atomMastery.cooldownUntilMasteryCount,
    })
    .from(atomMastery)
    .where(eq(atomMastery.userId, userId));

  const masteredSet = new Set(
    masteryRows.filter((r) => r.isMastered).map((r) => r.atomId)
  );
  const cooldownSet = new Set(
    masteryRows.filter((r) => r.cooldown && r.cooldown > 0).map((r) => r.atomId)
  );

  const candidates = await db
    .select({ id: atoms.id, title: atoms.title })
    .from(atoms)
    .where(eq(atoms.subjectId, current.subjectId))
    .limit(50);

  const next = candidates.find(
    (a) => !masteredSet.has(a.id) && !cooldownSet.has(a.id)
  );
  return next ?? null;
}

/**
 * Syncs the atom_mastery row to "mastered" status after a study session.
 */
export async function syncAtomMasteryOnMastered(
  userId: string,
  atomId: string
) {
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

/**
 * Evaluates whether the habit quality guard should suggest an intervention
 * based on consecutive failures and daily mastery count.
 */
export async function evaluateHabitGuard(
  userId: string,
  consecutiveIncorrect: number
): Promise<HabitGuardSignal | undefined> {
  if (consecutiveIncorrect < 2) return undefined;

  const [dailyMasteries, reviewDue] = await Promise.all([
    getDailyMasteryCount(userId),
    getReviewDueItems(userId),
  ]);

  return evaluateSessionFatigue(
    consecutiveIncorrect,
    dailyMasteries,
    reviewDue.length > 0
  );
}
