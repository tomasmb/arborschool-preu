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
import { atomMastery, questions } from "@/db/schema";

export type StudentMetrics = {
  masteredAtoms: number;
  totalRelevantAtoms: number;
  masteryPercentage: number;
  questionsUnlocked: number;
  totalOfficialQuestions: number;
};

/**
 * Counts atoms relevant to official PAES questions.
 * An atom is relevant if it is directly linked to an official question
 * OR is a direct prerequisite of such an atom (~205 atoms).
 */
const RELEVANT_ATOMS_SQL = sql`
  WITH directly_linked AS (
    SELECT DISTINCT qa.atom_id AS id
    FROM question_atoms qa
    JOIN questions q ON q.id = qa.question_id
    WHERE q.source = 'official'
  ),
  prereqs AS (
    SELECT DISTINCT unnest(a.prerequisite_ids) AS id
    FROM atoms a
    WHERE a.id IN (SELECT id FROM directly_linked)
      AND a.prerequisite_ids IS NOT NULL
  ),
  combined AS (
    SELECT id FROM directly_linked
    UNION
    SELECT id FROM prereqs
  )
  SELECT count(*) AS count
  FROM combined c
  JOIN atoms a ON a.id = c.id
`;

/**
 * Computes core student metrics scoped to goal-relevant atoms.
 *
 * "Relevant atoms" = atoms directly linked to official PAES questions
 * PLUS their direct prerequisites (~205). This matches the canonical
 * set of M1 concepts a student may need to master.
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
      db.execute(RELEVANT_ATOMS_SQL),
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
  const totalRelevantAtoms = Number(
    (relevantAtomRows as unknown as Array<{ count: number }>)[0]?.count ?? 0
  );
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
