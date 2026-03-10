/**
 * Shared Metrics Service — single source of truth for student metrics.
 *
 * All UI surfaces (dashboard, learning path, goals, study result) consume
 * metrics from this service. No duplicate calculations across components.
 *
 * See docs/arbor-learning-system-spec.md section 10 for contracts.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";

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
 * "Relevant atoms" = atoms directly linked to official PAES questions
 * PLUS their direct prerequisites (~205). This matches the canonical
 * set of M1 concepts a student may need to master.
 *
 * Spec 10.3: masteredAtoms is scoped to the relevant set, NOT all 229.
 */
export async function getStudentMetrics(
  userId: string
): Promise<StudentMetrics> {
  const [scopedRows, unlockedRows, totalQRows] = await Promise.all([
    db.execute(sql`
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
      relevant AS (
        SELECT id FROM directly_linked
        UNION
        SELECT id FROM prereqs
      )
      SELECT
        count(DISTINCT r.id) AS total,
        count(DISTINCT CASE
          WHEN am.is_mastered = true THEN r.id
        END) AS mastered
      FROM relevant r
      JOIN atoms a ON a.id = r.id
      LEFT JOIN atom_mastery am
        ON am.atom_id = r.id AND am.user_id = ${userId}
    `),
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

  type CountRow = Record<string, string | number>;
  const scoped = (scopedRows as unknown as CountRow[])[0] ?? {};
  const masteredAtoms = Number(scoped.mastered ?? 0);
  const totalRelevantAtoms = Number(scoped.total ?? 0);
  const questionsUnlocked = Number(
    (unlockedRows as unknown as CountRow[])[0]?.count ?? 0
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
