/**
 * DB Performance Profiling Script
 *
 * Benchmarks key database functions against real data to measure
 * optimization impact. Run before and after changes to compare.
 *
 * Usage:
 *   cd web
 *   export $(grep -v '^#' .env.local | xargs)
 *   npx tsx scripts/profileDbPerformance.ts
 */

import { sql, eq, desc, and, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { users, atomMastery, testAttempts } from "@/db/schema";

import { getRetestStatus } from "@/lib/student/retestGating";
import { getReviewDueItems } from "@/lib/student/spacedRepetition";
import {
  getMasteryStatusBreakdown,
  getAxisMasteryBreakdown,
  getMasteryBreakdowns,
} from "@/lib/student/metricsService";
import { getStudentNextAction } from "@/lib/student/nextAction";
import { getM1Dashboard } from "@/lib/student/dashboardM1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findBenchmarkUserId(): Promise<string> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(isNotNull(users.paesScoreMin), isNotNull(users.paesScoreMax))
    )
    .orderBy(desc(users.updatedAt))
    .limit(1);

  if (!row) throw new Error("No student with diagnostic data found");
  return row.id;
}

type BenchResult = { name: string; runs: number[]; median: number };

async function bench(
  name: string,
  fn: () => Promise<unknown>,
  iterations = 5
): Promise<BenchResult> {
  const runs: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    runs.push(Math.round((performance.now() - start) * 100) / 100);
  }
  const sorted = [...runs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return { name, runs, median };
}

function printTable(results: BenchResult[]) {
  const nameWidth = Math.max(...results.map((r) => r.name.length), 8);
  const header = [
    "Function".padEnd(nameWidth),
    "Median".padStart(10),
    "Min".padStart(10),
    "Max".padStart(10),
    "All runs (ms)",
  ].join(" | ");

  console.log("\n" + "=".repeat(header.length));
  console.log(header);
  console.log("-".repeat(header.length));

  for (const r of results) {
    const sorted = [...r.runs].sort((a, b) => a - b);
    console.log(
      [
        r.name.padEnd(nameWidth),
        `${r.median} ms`.padStart(10),
        `${sorted[0]} ms`.padStart(10),
        `${sorted[sorted.length - 1]} ms`.padStart(10),
        sorted.map((v) => `${v}`).join(", "),
      ].join(" | ")
    );
  }

  console.log("=".repeat(header.length) + "\n");
}

// ---------------------------------------------------------------------------
// EXPLAIN ANALYZE helpers (baseline for index profiling)
// ---------------------------------------------------------------------------

async function runExplainAnalyze(label: string, query: string) {
  console.log(`\n--- EXPLAIN ANALYZE: ${label} ---`);
  const rows = await db.execute(sql.raw(`EXPLAIN ANALYZE ${query}`));
  for (const row of rows as unknown as Record<string, string>[]) {
    console.log(row["QUERY PLAN"] ?? JSON.stringify(row));
  }
}

async function explainBaselines(userId: string) {
  console.log("\n\n========== EXPLAIN ANALYZE BASELINES ==========");

  await runExplainAnalyze(
    "atom_mastery by (userId, isMastered, masterySource)",
    `SELECT count(*) FROM atom_mastery WHERE user_id = '${userId}' AND is_mastered = true AND mastery_source = 'study'`
  );

  await runExplainAnalyze(
    "atom_mastery by (userId, status)",
    `SELECT count(*) FROM atom_mastery WHERE user_id = '${userId}' AND status = 'needs_verification'`
  );

  await runExplainAnalyze(
    "test_attempts by (userId, completedAt)",
    `SELECT completed_at FROM test_attempts WHERE user_id = '${userId}' AND completed_at IS NOT NULL AND test_id IS NOT NULL ORDER BY completed_at DESC LIMIT 1`
  );

  await runExplainAnalyze(
    "generated_questions by (atomId, difficultyLevel)",
    `SELECT id FROM generated_questions WHERE atom_id = 'paes_m1_ALG_001' AND difficulty_level = 'high' LIMIT 5`
  );

  await runExplainAnalyze(
    "atom_study_sessions by (userId, sessionType)",
    `SELECT completed_at FROM atom_study_sessions WHERE user_id = '${userId}' AND session_type = 'review' AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Finding benchmark user...");
  const userId = await findBenchmarkUserId();
  console.log(`Using userId: ${userId}`);

  const [masteryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atomMastery)
    .where(eq(atomMastery.userId, userId));
  const [attemptCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testAttempts)
    .where(eq(testAttempts.userId, userId));

  console.log(`  Mastery rows: ${masteryCount?.count ?? 0}`);
  console.log(`  Test attempts: ${attemptCount?.count ?? 0}`);

  console.log("\nRunning benchmarks (5 iterations each)...\n");

  const results: BenchResult[] = [];

  results.push(await bench("getRetestStatus", () => getRetestStatus(userId)));

  results.push(
    await bench("getReviewDueItems", () => getReviewDueItems(userId))
  );

  results.push(
    await bench("getMasteryStatusBreakdown", () =>
      getMasteryStatusBreakdown(userId)
    )
  );

  results.push(
    await bench("getAxisMasteryBreakdown", () =>
      getAxisMasteryBreakdown(userId)
    )
  );

  results.push(
    await bench("both breakdowns sequential", async () => {
      await getMasteryStatusBreakdown(userId);
      await getAxisMasteryBreakdown(userId);
    })
  );

  results.push(
    await bench("getMasteryBreakdowns (combined)", () =>
      getMasteryBreakdowns(userId)
    )
  );

  // getStudentNextAction and getM1Dashboard use analyzeLearningPotential
  // which depends on unstable_cache (Next.js runtime only). Wrap in try/catch
  // so standalone profiling still reports the functions we *can* measure.
  try {
    results.push(
      await bench("getStudentNextAction", () => getStudentNextAction(userId))
    );
  } catch {
    console.log("  [skip] getStudentNextAction — requires Next.js runtime");
  }

  try {
    results.push(
      await bench("getM1Dashboard", () => getM1Dashboard(userId))
    );
  } catch {
    console.log("  [skip] getM1Dashboard — requires Next.js runtime");
  }

  printTable(results);

  await explainBaselines(userId);

  console.log("\nDone. Closing connection...");
  process.exit(0);
}

main().catch((err) => {
  console.error("Profile failed:", err);
  process.exit(1);
});
