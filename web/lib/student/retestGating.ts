/**
 * Retest Gating — controls when students can take a full timed test.
 *
 * Policy:
 * - First test after diagnostic: available immediately (no atom gate)
 * - Subsequent tests: RETEST_ATOM_THRESHOLD atoms since last test to unlock
 * - RECOMMEND_THRESHOLD atoms to actively recommend retest
 * - Minimum 7 day spacing between full tests
 * - Max 3 full tests per month
 *
 * All gating data is fetched in a single CTE query to minimize DB
 * round-trips (was 1-4 sequential queries before consolidation).
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { RETEST_ATOM_THRESHOLD } from "@/lib/diagnostic/scoringConstants";

const UNLOCK_THRESHOLD = RETEST_ATOM_THRESHOLD;
const RECOMMEND_THRESHOLD = 30;
const MIN_SPACING_DAYS = 7;
const MAX_TESTS_PER_MONTH = 3;

export type RetestStatus = {
  atomsMasteredSinceLastTest: number;
  eligible: boolean;
  recommended: boolean;
  blockedReason: string | null;
  daysSinceLastTest: number | null;
  isFirstTest: boolean;
};

/**
 * Whether the student has ever completed a full timed test (not just a
 * short diagnostic). Used by callers that need this check independently
 * of the full retest gating logic (e.g. free-tier gate in full-test/start).
 */
export async function hasCompletedFullTest(
  userId: string
): Promise<boolean> {
  const [row] = await db.execute<{ has_test: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM test_attempts
      WHERE user_id = ${userId}
        AND completed_at IS NOT NULL
        AND test_id IS NOT NULL
    ) AS has_test
  `);
  return row?.has_test === true;
}

type RetestGatingRow = {
  last_test_date: Date | null;
  diag_score: number | null;
  atoms_since: string;
  tests_this_month: string;
};

/**
 * Fetches all retest gating data in a single CTE query: last full test
 * date, diagnostic score, study-mastered atoms since last test, and
 * full tests completed in the last 30 days.
 */
async function fetchRetestGatingData(
  userId: string
): Promise<RetestGatingRow> {
  const rows = await db.execute<RetestGatingRow>(sql`
    WITH last_full_test AS (
      SELECT completed_at
      FROM test_attempts
      WHERE user_id = ${userId}
        AND completed_at IS NOT NULL
        AND test_id IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 1
    )
    SELECT
      (SELECT completed_at FROM last_full_test) AS last_test_date,
      (SELECT paes_score_min FROM users WHERE id = ${userId}) AS diag_score,
      (
        SELECT count(*)
        FROM atom_mastery
        WHERE user_id = ${userId}
          AND is_mastered = true
          AND mastery_source = 'study'
          AND updated_at >= COALESCE(
            (SELECT completed_at FROM last_full_test),
            '1970-01-01'::timestamptz
          )
      ) AS atoms_since,
      (
        SELECT count(*)
        FROM test_attempts
        WHERE user_id = ${userId}
          AND completed_at >= now() - interval '30 days'
          AND test_id IS NOT NULL
      ) AS tests_this_month
  `);

  return (rows as unknown as RetestGatingRow[])[0];
}

/**
 * Determines retest eligibility and recommendation in a single DB call.
 *
 * First test: available immediately after diagnostic — the diagnostic is
 * a rough screen (16 questions) and many atoms remain uncovered.
 *
 * Subsequent tests: normal gating (18 atoms, 7 days, 3/month).
 */
export async function getRetestStatus(
  userId: string
): Promise<RetestStatus> {
  const data = await fetchRetestGatingData(userId);

  const lastTestDate = data.last_test_date
    ? new Date(data.last_test_date)
    : null;

  if (lastTestDate === null) {
    const hasDiag = data.diag_score != null;
    return {
      atomsMasteredSinceLastTest: 0,
      eligible: hasDiag,
      recommended: hasDiag,
      blockedReason: hasDiag
        ? null
        : "Completa el diagnóstico primero",
      daysSinceLastTest: null,
      isFirstTest: true,
    };
  }

  const atomsMastered = Number(data.atoms_since);
  const daysSinceLastTest = Math.floor(
    (Date.now() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (atomsMastered < UNLOCK_THRESHOLD) {
    return {
      atomsMasteredSinceLastTest: atomsMastered,
      eligible: false,
      recommended: false,
      blockedReason:
        `Necesitas dominar ${UNLOCK_THRESHOLD - atomsMastered} conceptos más`,
      daysSinceLastTest,
      isFirstTest: false,
    };
  }

  if (daysSinceLastTest < MIN_SPACING_DAYS) {
    return {
      atomsMasteredSinceLastTest: atomsMastered,
      eligible: false,
      recommended: false,
      blockedReason:
        `Espera ${MIN_SPACING_DAYS - daysSinceLastTest} días más entre tests`,
      daysSinceLastTest,
      isFirstTest: false,
    };
  }

  const testsThisMonth = Number(data.tests_this_month);
  if (testsThisMonth >= MAX_TESTS_PER_MONTH) {
    return {
      atomsMasteredSinceLastTest: atomsMastered,
      eligible: false,
      recommended: false,
      blockedReason: "Máximo de tests mensuales alcanzado",
      daysSinceLastTest,
      isFirstTest: false,
    };
  }

  return {
    atomsMasteredSinceLastTest: atomsMastered,
    eligible: true,
    recommended: atomsMastered >= RECOMMEND_THRESHOLD,
    blockedReason: null,
    daysSinceLastTest,
    isFirstTest: false,
  };
}
