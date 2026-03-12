/**
 * Retest Gating — controls when students can take a full timed test.
 *
 * Policy (from arbor-learning-system-spec.md):
 * - X = 18 atoms since last test to unlock eligibility
 * - Y = 30 atoms to actively recommend retest
 * - Minimum 7 day spacing between full tests
 * - Max 3 full tests per month
 */

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { atomMastery, testAttempts } from "@/db/schema";

const UNLOCK_THRESHOLD = 18;
const RECOMMEND_THRESHOLD = 30;
const MIN_SPACING_DAYS = 7;
const MAX_TESTS_PER_MONTH = 3;

export type RetestStatus = {
  atomsMasteredSinceLastTest: number;
  eligible: boolean;
  recommended: boolean;
  blockedReason: string | null;
  daysSinceLastTest: number | null;
};

/**
 * Returns the timestamp of the student's last completed full test.
 * Excludes short diagnostics (identified by test_id IS NULL, i.e. no
 * reference to an actual test entity). Only real full-length tests count.
 */
async function getLastFullTestDate(userId: string): Promise<Date | null> {
  const [row] = await db
    .select({ completedAt: testAttempts.completedAt })
    .from(testAttempts)
    .where(
      and(
        eq(testAttempts.userId, userId),
        sql`${testAttempts.completedAt} IS NOT NULL`,
        sql`${testAttempts.testId} IS NOT NULL`
      )
    )
    .orderBy(desc(testAttempts.completedAt))
    .limit(1);
  return row?.completedAt ?? null;
}

/**
 * Whether the student has ever completed a full timed test (not just a
 * short diagnostic). Used to determine the diagnostic source label.
 */
export async function hasCompletedFullTest(userId: string): Promise<boolean> {
  const date = await getLastFullTestDate(userId);
  return date !== null;
}

/**
 * Counts atoms mastered via study since the given date.
 * Only study-mastered atoms count toward retest thresholds (diagnostic
 * mastery is the baseline, not progress).
 */
async function countAtomsMasteredSinceViaStudy(
  userId: string,
  since: Date | null
): Promise<number> {
  const conds = [
    eq(atomMastery.userId, userId),
    eq(atomMastery.isMastered, true),
    eq(atomMastery.masterySource, "study"),
  ];
  if (since) {
    conds.push(gte(atomMastery.updatedAt, since));
  }
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atomMastery)
    .where(and(...conds));
  return Number(row?.count ?? 0);
}

/**
 * Counts full tests (not diagnostics) completed in the last 30 days.
 */
async function countFullTestsInLastMonth(userId: string): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testAttempts)
    .where(
      and(
        eq(testAttempts.userId, userId),
        gte(testAttempts.completedAt, thirtyDaysAgo),
        sql`${testAttempts.testId} IS NOT NULL`
      )
    );
  return Number(row?.count ?? 0);
}

/**
 * Determines if the student is eligible for and/or should be recommended
 * to take a full timed retest.
 */
export async function getRetestStatus(userId: string): Promise<RetestStatus> {
  const lastTestDate = await getLastFullTestDate(userId);
  const atomsMastered = await countAtomsMasteredSinceViaStudy(
    userId,
    lastTestDate
  );

  let daysSinceLastTest: number | null = null;
  if (lastTestDate) {
    daysSinceLastTest = Math.floor(
      (Date.now() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  if (atomsMastered < UNLOCK_THRESHOLD) {
    return {
      atomsMasteredSinceLastTest: atomsMastered,
      eligible: false,
      recommended: false,
      blockedReason: `Necesitas dominar ${UNLOCK_THRESHOLD - atomsMastered} conceptos más`,
      daysSinceLastTest,
    };
  }

  if (daysSinceLastTest !== null && daysSinceLastTest < MIN_SPACING_DAYS) {
    return {
      atomsMasteredSinceLastTest: atomsMastered,
      eligible: false,
      recommended: false,
      blockedReason: `Espera ${MIN_SPACING_DAYS - daysSinceLastTest} días más entre tests`,
      daysSinceLastTest,
    };
  }

  const testsThisMonth = await countFullTestsInLastMonth(userId);
  if (testsThisMonth >= MAX_TESTS_PER_MONTH) {
    return {
      atomsMasteredSinceLastTest: atomsMastered,
      eligible: false,
      recommended: false,
      blockedReason: "Máximo de tests mensuales alcanzado",
      daysSinceLastTest,
    };
  }

  return {
    atomsMasteredSinceLastTest: atomsMastered,
    eligible: true,
    recommended: atomsMastered >= RECOMMEND_THRESHOLD,
    blockedReason: null,
    daysSinceLastTest,
  };
}
