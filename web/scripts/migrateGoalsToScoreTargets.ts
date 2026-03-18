/**
 * Data migration: populate studentScoreTargets from existing primary
 * goal scores.
 *
 * For each user with existing studentGoals + studentGoalScores, takes the
 * primary goal's scores and inserts them into studentScoreTargets as
 * general targets. Does NOT modify existing tables.
 *
 * Usage: npx tsx scripts/migrateGoalsToScoreTargets.ts
 */

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  studentGoals,
  studentGoalScores,
  studentScoreTargets,
} from "../db/schema";
import * as schema from "../db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 30,
  connect_timeout: 30,
});
const db = drizzle(sql, { schema });

async function main() {
  console.log("Starting migration: goals -> score targets");

  // Find all users with primary goals that have scores
  const goalRows = await db
    .select({
      userId: studentGoals.userId,
      testCode: studentGoalScores.testCode,
      score: studentGoalScores.score,
    })
    .from(studentGoals)
    .innerJoin(studentGoalScores, eq(studentGoalScores.goalId, studentGoals.id))
    .where(eq(studentGoals.isPrimary, true));

  if (goalRows.length === 0) {
    console.log("No existing goal scores to migrate. Done.");
    await sql.end();
    return;
  }

  // Group by user, keeping highest score per test code
  const byUser = new Map<string, Map<string, string>>();
  for (const row of goalRows) {
    if (!byUser.has(row.userId)) {
      byUser.set(row.userId, new Map());
    }
    const userScores = byUser.get(row.userId)!;
    const existing = userScores.get(row.testCode);
    if (!existing || Number(row.score) > Number(existing)) {
      userScores.set(row.testCode, row.score);
    }
  }

  let inserted = 0;
  let skipped = 0;

  for (const [userId, scores] of byUser) {
    for (const [testCode, score] of scores) {
      // Check if already migrated
      const [existing] = await db
        .select({ id: studentScoreTargets.id })
        .from(studentScoreTargets)
        .where(
          and(
            eq(studentScoreTargets.userId, userId),
            eq(studentScoreTargets.testCode, testCode)
          )
        )
        .limit(1);

      if (existing) {
        skipped++;
        continue;
      }

      await db.insert(studentScoreTargets).values({
        userId,
        testCode,
        score,
      });
      inserted++;
    }
  }

  console.log(
    `Migration complete: ${inserted} score targets inserted, ${skipped} skipped (already existed)`
  );
  console.log(
    `Processed ${byUser.size} users from ${goalRows.length} goal score rows`
  );

  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
