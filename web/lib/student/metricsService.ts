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

export type MasteryStatusBreakdown = {
  mastered: number;
  inProgress: number;
  needsVerification: number;
  notStarted: number;
  total: number;
};

export type AxisMasteryItem = {
  axis: string;
  axisCode: string;
  label: string;
  mastered: number;
  total: number;
};

const AXIS_DISPLAY_NAMES: Record<string, string> = {
  algebra_y_funciones: "Álgebra y Funciones",
  numeros: "Números",
  geometria: "Geometría",
  probabilidad_y_estadistica: "Probabilidad y Estadística",
};

const AXIS_SHORT_CODES: Record<string, string> = {
  algebra_y_funciones: "ALG",
  numeros: "NUM",
  geometria: "GEO",
  probabilidad_y_estadistica: "PROB",
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

/** CTE fragment for the ~205 goal-relevant atoms (reused across queries). */
const RELEVANT_ATOMS_CTE = sql`
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
`;

/**
 * Fetches both status breakdown and per-axis breakdown in a single query.
 * Groups by axis so we get per-axis rows; the global totals are summed
 * in JS from the per-axis rows.
 */
export async function getMasteryBreakdowns(
  userId: string
): Promise<{
  statusBreakdown: MasteryStatusBreakdown;
  axisBreakdown: AxisMasteryItem[];
}> {
  type Row = {
    axis: string;
    total: string;
    mastered: string;
    status_mastered: string;
    status_in_progress: string;
    status_needs_verification: string;
    status_not_started: string;
  };

  const rows = await db.execute<Row>(sql`
    ${RELEVANT_ATOMS_CTE}
    SELECT
      a.axis,
      count(*) AS total,
      count(*) FILTER (WHERE am.is_mastered = true) AS mastered,
      count(*) FILTER (WHERE am.status = 'mastered') AS status_mastered,
      count(*) FILTER (WHERE am.status = 'in_progress') AS status_in_progress,
      count(*) FILTER (
        WHERE am.status = 'needs_verification'
      ) AS status_needs_verification,
      count(*) FILTER (
        WHERE am.status IS NULL OR am.status = 'not_started'
      ) AS status_not_started
    FROM relevant r
    JOIN atoms a ON a.id = r.id
    LEFT JOIN atom_mastery am
      ON am.atom_id = r.id AND am.user_id = ${userId}
    GROUP BY a.axis
    ORDER BY a.axis
  `);

  const rawRows = rows as unknown as Row[];
  let sMastered = 0,
    sInProgress = 0,
    sNeedsVerification = 0,
    sNotStarted = 0,
    sTotal = 0;

  const axisBreakdown: AxisMasteryItem[] = rawRows.map((r) => {
    const axis = String(r.axis);
    sMastered += Number(r.status_mastered ?? 0);
    sInProgress += Number(r.status_in_progress ?? 0);
    sNeedsVerification += Number(r.status_needs_verification ?? 0);
    sNotStarted += Number(r.status_not_started ?? 0);
    sTotal += Number(r.total ?? 0);

    return {
      axis,
      axisCode: AXIS_SHORT_CODES[axis] ?? axis,
      label: AXIS_DISPLAY_NAMES[axis] ?? axis,
      mastered: Number(r.mastered ?? 0),
      total: Number(r.total ?? 0),
    };
  });

  return {
    statusBreakdown: {
      mastered: sMastered,
      inProgress: sInProgress,
      needsVerification: sNeedsVerification,
      notStarted: sNotStarted,
      total: sTotal,
    },
    axisBreakdown,
  };
}

/**
 * Counts relevant atoms grouped by mastery status.
 * Delegates to the combined query for backward compatibility.
 */
export async function getMasteryStatusBreakdown(
  userId: string
): Promise<MasteryStatusBreakdown> {
  const { statusBreakdown } = await getMasteryBreakdowns(userId);
  return statusBreakdown;
}

/**
 * Returns mastery counts for each axis, scoped to relevant atoms.
 * Delegates to the combined query for backward compatibility.
 */
export async function getAxisMasteryBreakdown(
  userId: string
): Promise<AxisMasteryItem[]> {
  const { axisBreakdown } = await getMasteryBreakdowns(userId);
  return axisBreakdown;
}
