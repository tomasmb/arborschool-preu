/**
 * Shared Metrics Service — single source of truth for student metrics.
 *
 * All UI surfaces (dashboard, learning path, goals, study result) consume
 * metrics from this service. No duplicate calculations across components.
 *
 * See docs/arbor-learning-system-spec.md section 10 for contracts.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { atomMastery, questionAtoms, questions, atoms } from "@/db/schema";

export type StudentMetrics = {
  masteredAtoms: number;
  totalRelevantAtoms: number;
  masteryPercentage: number;
  questionsUnlocked: number;
  totalOfficialQuestions: number;
};

/**
 * Computes core student metrics scoped to goal-relevant atoms.
 *
 * "Relevant atoms" = atoms that are directly or transitively linked to
 * official PAES questions. This avoids showing artificially low percentages
 * by counting all 229 atoms when many are not relevant to the student's
 * current goals.
 */
export async function getStudentMetrics(
  userId: string
): Promise<StudentMetrics> {
  const [masteredRows, relevantAtomRows, unlockedRows, totalQRows] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(atomMastery)
        .where(
          and(eq(atomMastery.userId, userId), eq(atomMastery.isMastered, true))
        ),
      db
        .select({ count: sql<number>`count(DISTINCT ${questionAtoms.atomId})` })
        .from(questionAtoms)
        .innerJoin(questions, eq(questions.id, questionAtoms.questionId))
        .innerJoin(atoms, eq(atoms.id, questionAtoms.atomId))
        .where(eq(questions.source, "official")),
      db.execute(sql`
        SELECT count(DISTINCT q.id) as count
        FROM questions q
        WHERE q.source = 'official'
          AND NOT EXISTS (
            SELECT 1
            FROM question_atoms qa
            WHERE qa.question_id = q.id
              AND qa.relevance = 'primary'
              AND NOT EXISTS (
                SELECT 1
                FROM atom_mastery am
                WHERE am.atom_id = qa.atom_id
                  AND am.user_id = ${userId}
                  AND am.is_mastered = true
              )
          )
      `),
      db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(eq(questions.source, "official")),
    ]);

  const masteredAtoms = Number(masteredRows[0]?.count ?? 0);
  const totalRelevantAtoms = Number(relevantAtomRows[0]?.count ?? 0);
  const questionsUnlocked = Number(
    (unlockedRows as unknown as Array<{ count: number }>)[0]?.count ?? 0
  );
  const totalOfficialQuestions = Number(totalQRows[0]?.count ?? 0);

  const masteryPercentage =
    totalRelevantAtoms > 0
      ? Math.round((masteredAtoms / totalRelevantAtoms) * 100)
      : 0;

  return {
    masteredAtoms,
    totalRelevantAtoms,
    masteryPercentage,
    questionsUnlocked,
    totalOfficialQuestions,
  };
}
