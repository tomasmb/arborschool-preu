/**
 * Backfill diagnostic atom mastery for users who completed a diagnostic
 * but have no atom_mastery records from it.
 *
 * This happens when the client-side profile save fails to send atomResults
 * or when the save itself fails silently.
 *
 * Usage: npx tsx scripts/backfillDiagnosticMastery.ts
 */

import "./loadEnv";
import { db } from "@/db";
import {
  atomMastery,
  studentResponses,
  questionAtoms,
  testAttempts,
} from "@/db/schema";
import { and, eq, desc, sql, isNotNull } from "drizzle-orm";
import { computeFullMasteryWithTransitivity } from "@/lib/diagnostic/atomMastery";

const MASTERY_BATCH_SIZE = 50;

async function getUsersNeedingBackfill() {
  const rows = await db.execute(sql`
    SELECT DISTINCT ta.user_id
    FROM test_attempts ta
    WHERE ta.completed_at IS NOT NULL
      AND ta.test_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM atom_mastery am
        WHERE am.user_id = ta.user_id
          AND am.mastery_source = 'diagnostic'
      )
  `);
  return (rows as unknown as Array<{ user_id: string }>).map((r) => r.user_id);
}

async function getLatestDiagnosticAttempt(userId: string) {
  const [attempt] = await db
    .select({ id: testAttempts.id })
    .from(testAttempts)
    .where(
      and(
        eq(testAttempts.userId, userId),
        isNotNull(testAttempts.completedAt),
        sql`${testAttempts.testId} IS NULL`
      )
    )
    .orderBy(desc(testAttempts.completedAt))
    .limit(1);
  return attempt ?? null;
}

async function getResponsesWithAtoms(attemptId: string) {
  return db
    .select({
      questionId: studentResponses.questionId,
      isCorrect: studentResponses.isCorrect,
      atomId: questionAtoms.atomId,
      relevance: questionAtoms.relevance,
    })
    .from(studentResponses)
    .innerJoin(
      questionAtoms,
      eq(questionAtoms.questionId, studentResponses.questionId)
    )
    .where(eq(studentResponses.testAttemptId, attemptId));
}

function computeAtomResults(
  responses: Array<{
    questionId: string;
    isCorrect: boolean;
    atomId: string;
  }>
) {
  const atomMap = new Map<string, boolean>();

  for (const r of responses) {
    const current = atomMap.get(r.atomId);
    if (current === undefined) {
      atomMap.set(r.atomId, r.isCorrect);
    } else if (r.isCorrect && !current) {
      atomMap.set(r.atomId, true);
    }
  }

  return Array.from(atomMap.entries()).map(([atomId, mastered]) => ({
    atomId,
    mastered,
  }));
}

async function backfillUser(userId: string) {
  const attempt = await getLatestDiagnosticAttempt(userId);
  if (!attempt) {
    console.log(`  [skip] No completed diagnostic for ${userId}`);
    return 0;
  }

  const responses = await getResponsesWithAtoms(attempt.id);
  if (responses.length === 0) {
    console.log(`  [skip] No responses with atoms for ${userId}`);
    return 0;
  }

  const validResponses = responses.filter(
    (r): r is typeof r & { questionId: string } => r.questionId !== null
  );
  const atomResults = computeAtomResults(validResponses);
  const fullMastery = await computeFullMasteryWithTransitivity(atomResults);
  const now = new Date();

  const records = fullMastery.map((result) => ({
    userId,
    atomId: result.atomId,
    status: result.mastered ? ("mastered" as const) : ("not_started" as const),
    isMastered: result.mastered,
    masterySource: result.mastered ? ("diagnostic" as const) : null,
    firstMasteredAt: result.mastered ? now : null,
    lastDemonstratedAt: result.source === "direct" ? now : null,
    totalAttempts: result.source === "direct" ? 1 : 0,
    correctAttempts: result.source === "direct" && result.mastered ? 1 : 0,
  }));

  let inserted = 0;
  for (let i = 0; i < records.length; i += MASTERY_BATCH_SIZE) {
    const batch = records.slice(i, i + MASTERY_BATCH_SIZE);
    await db.insert(atomMastery).values(batch).onConflictDoNothing();
    inserted += batch.length;
  }

  const mastered = records.filter((r) => r.isMastered).length;
  console.log(
    `  [done] ${userId}: ${inserted} new rows (${mastered} mastered)`
  );
  return inserted;
}

async function main() {
  console.log("Backfilling diagnostic atom mastery...\n");

  const userIds = await getUsersNeedingBackfill();
  console.log(`Found ${userIds.length} user(s) needing backfill\n`);

  let totalInserted = 0;
  for (const userId of userIds) {
    totalInserted += await backfillUser(userId);
  }

  console.log(`\nDone. Inserted ${totalInserted} total rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
