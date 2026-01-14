#!/usr/bin/env node

/**
 * Database migration script for production
 * Runs pending migrations using the postgres driver directly
 * This is executed before the Next.js server starts
 */

const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

// Build connection string from environment
function getConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.DB_USER || "preu_app";
  const password = process.env.DB_PASSWORD || "";
  const host = process.env.DB_HOST || "localhost";
  const database = process.env.DB_NAME || "preu";
  const port = process.env.DB_PORT || "5432";

  // Cloud Run uses Unix socket via Cloud SQL Auth Proxy
  if (host.startsWith("/cloudsql/")) {
    return `postgresql://${user}:${password}@localhost/${database}?host=${host}`;
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

async function runMigrations() {
  console.log("[migrate] Starting database migration check...");

  const connectionString = getConnectionString();
  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 30,
    idle_timeout: 5,
  });

  try {
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
      const statements = content
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        try {
          await sql.unsafe(statement);
        } catch (err) {
          // Ignore "already exists" type errors for idempotency
          if (
            err.code === "42701" || // column already exists
            err.code === "42710" || // object already exists
            err.code === "42P07" || // relation already exists
            err.code === "42P16" // invalid table definition (often means already correct)
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
  } catch (error) {
    console.error("[migrate] Migration failed:", error.message);
    await sql.end();
    process.exit(1);
  }
}

runMigrations();
