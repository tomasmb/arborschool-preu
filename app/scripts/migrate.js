#!/usr/bin/env node

/**
 * Database migration script
 * Runs pending migrations using the postgres driver directly
 *
 * Usage: DATABASE_URL=... node scripts/migrate.js
 *
 * For Vercel deployments, run migrations locally or via CI before deploying:
 *   npx drizzle-kit migrate
 */

const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[migrate] DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const maskedUrl = connectionString.replace(/:[^:@]+@/, ":***@");
  console.log("[migrate] Connecting to:", maskedUrl);

  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    // Quick connection test
    await sql`SELECT 1`;
    console.log("[migrate] Database connected successfully");

    // Create migrations tracking table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Get list of applied migrations
    const applied = await sql`SELECT name FROM _drizzle_migrations`;
    const appliedSet = new Set(applied.map((r) => r.name));

    // Get migration files
    const migrationsDir = path.join(__dirname, "../db/migrations");

    if (!fs.existsSync(migrationsDir)) {
      console.log("[migrate] No migrations directory found, skipping");
      await sql.end();
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let migrationsRun = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue;
      }

      console.log(`[migrate] Applying migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Split by statement breakpoint marker and filter empty statements
      // Strip leading comment lines from each chunk (comments start with --)
      const statements = content
        .split("--> statement-breakpoint")
        .map((s) => {
          // Remove leading comment lines but keep the SQL
          const lines = s.split("\n");
          const firstNonCommentIndex = lines.findIndex(
            (line) => line.trim() && !line.trim().startsWith("--")
          );
          if (firstNonCommentIndex === -1) return "";
          return lines.slice(firstNonCommentIndex).join("\n").trim();
        })
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await sql.unsafe(statement);
        } catch (err) {
          // Ignore "already exists" type errors for idempotency
          if (
            err.code === "42701" || // column already exists
            err.code === "42710" || // object already exists
            err.code === "42P07" || // relation already exists
            err.code === "42P16" // invalid table definition
          ) {
            console.log(`[migrate] Skipping (already applied): ${err.message}`);
          } else {
            throw err;
          }
        }
      }

      // Mark as applied
      await sql`INSERT INTO _drizzle_migrations (name) VALUES (${file})`;
      migrationsRun++;
      console.log(`[migrate] Applied: ${file}`);
    }

    if (migrationsRun === 0) {
      console.log("[migrate] Database is up to date");
    } else {
      console.log(`[migrate] Applied ${migrationsRun} migration(s)`);
    }

    await sql.end();
    console.log("[migrate] Done");
  } catch (error) {
    console.error("[migrate] Migration failed:", error.message);
    try {
      await sql.end();
    } catch (e) {
      // Ignore close errors
    }
    process.exit(1);
  }
}

runMigrations();
