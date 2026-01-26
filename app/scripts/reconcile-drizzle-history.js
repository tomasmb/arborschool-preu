#!/usr/bin/env node

/**
 * Reconcile Drizzle migration history with an already-updated database.
 *
 * Why this exists:
 * - Drizzle stores applied migrations in `drizzle.__drizzle_migrations` by hash,
 *   not by filename.
 * - If schema changes were applied via other means (push/manual SQL/old scripts),
 *   the DB can contain changes that Drizzle doesn't recognize as "applied".
 * - Then `drizzle-kit migrate` tries to re-apply migrations and can fail with
 *   "already exists" errors.
 *
 * What this script does:
 * - Computes the Drizzle migration hash for each migration in meta/_journal.json
 *   (sha256 of the full SQL file contents).
 * - For migrations that are missing from `drizzle.__drizzle_migrations`, it
 *   verifies the expected schema changes exist and then inserts the missing
 *   migration hash rows to mark them as applied.
 *
 * Safety:
 * - This script does NOT attempt to apply schema changes.
 * - It refuses to mark a migration as applied unless verification passes.
 *
 * Usage:
 * - DRY RUN:  node scripts/reconcile-drizzle-history.js --dry-run
 * - LIMIT:    node scripts/reconcile-drizzle-history.js --tags 0001_rare_celestials,0002_parched_monster_badoon
 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

const MIGRATIONS_DIR = path.join(__dirname, "../db/migrations");
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, "meta/_journal.json");

function parseArgs(argv) {
  const args = { dryRun: false, tags: null };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    if (a === "--tags") {
      const value = argv[i + 1];
      if (!value) throw new Error("--tags requires a comma-separated value");
      args.tags = value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      i++;
    }
  }

  return args;
}

function readJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    throw new Error(`Missing Drizzle journal file at ${JOURNAL_PATH}`);
  }

  const raw = fs.readFileSync(JOURNAL_PATH, "utf-8");
  const parsed = JSON.parse(raw);

  if (!parsed.entries || !Array.isArray(parsed.entries)) {
    throw new Error("Invalid Drizzle journal: missing entries[]");
  }

  return parsed.entries.map((e) => ({
    tag: e.tag,
    when: e.when,
  }));
}

function computeDrizzleHash(sqlText) {
  return crypto.createHash("sha256").update(sqlText).digest("hex");
}

function readMigrationSql(tag) {
  const filePath = path.join(MIGRATIONS_DIR, `${tag}.sql`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing migration file: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

async function requireColumn(sql, tableName, columnName) {
  const rows = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    LIMIT 1
  `;
  if (rows.length === 0) {
    throw new Error(`Missing column public.${tableName}.${columnName}`);
  }
}

async function requireIndex(sql, indexName) {
  const rows = await sql`
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = ${indexName}
    LIMIT 1
  `;
  if (rows.length === 0) {
    throw new Error(`Missing index public.${indexName}`);
  }
}

async function verifyMigration(sql, tag) {
  if (tag === "0000_secret_imperial_guard") {
    await requireColumn(sql, "users", "id");
    await requireColumn(sql, "student_responses", "id");
    return;
  }

  if (tag === "0001_rare_celestials") {
    await requireColumn(sql, "student_responses", "stage");
    await requireColumn(sql, "student_responses", "question_index");
    await requireIndex(sql, "idx_student_responses_attempt");
    return;
  }

  if (tag === "0002_parched_monster_badoon") {
    await requireColumn(sql, "users", "unsubscribed");
    await requireColumn(sql, "users", "unsubscribed_at");
    await requireColumn(sql, "users", "notified_platform_launch");
    await requireColumn(sql, "users", "notified_platform_launch_at");
    return;
  }

  throw new Error(
    `No verification rules for tag ${tag}. Add checks before reconciling it.`
  );
}

async function main() {
  const { dryRun, tags } = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to reconcile migrations");
  }

  const entries = readJournal().filter((e) => !tags || tags.includes(e.tag));
  if (entries.length === 0) {
    console.log("[reconcile] No matching journal entries found, nothing to do");
    return;
  }

  const migrations = entries.map((e) => {
    const sqlText = readMigrationSql(e.tag);
    return {
      tag: e.tag,
      createdAt: e.when,
      hash: computeDrizzleHash(sqlText),
    };
  });

  const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10 });

  try {
    const table = await sql`SELECT to_regclass('drizzle.__drizzle_migrations') AS name`;
    if (!table[0]?.name) {
      throw new Error(
        "drizzle.__drizzle_migrations does not exist. Run drizzle-kit migrate once first."
      );
    }

    const existing = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
    const existingHashes = new Set(existing.map((r) => r.hash));

    const missing = migrations.filter((m) => !existingHashes.has(m.hash));
    if (missing.length === 0) {
      console.log("[reconcile] Migration history already matches journal hashes");
      return;
    }

    console.log(`[reconcile] Missing ${missing.length} migration(s) in history`);

    for (const m of missing) {
      await verifyMigration(sql, m.tag);
      if (dryRun) {
        console.log(`[reconcile] DRY RUN: would mark applied: ${m.tag}`);
        continue;
      }

      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${m.hash}, ${m.createdAt})
      `;
      console.log(`[reconcile] Marked applied: ${m.tag}`);
    }
  } finally {
    await sql.end({ timeout: 2 });
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[reconcile] Failed: ${message}`);
  process.exitCode = 1;
});

