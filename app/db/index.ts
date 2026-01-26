import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database connection for the application.
 * Uses postgres.js driver with Drizzle ORM.
 *
 * Connects via DATABASE_URL environment variable.
 * Works with Neon, Supabase, or any Postgres provider.
 */

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("[db] Missing required DATABASE_URL environment variable");
  }
  return url;
}

// Connection pool configuration optimized for serverless (Vercel)
// Neon recommends these settings for serverless environments
function getConnectionOptions() {
  return {
    max: 1, // Serverless: one connection per function instance
    idle_timeout: 20, // Close idle connections quickly
    connect_timeout: 10, // Reasonable timeout for serverless cold starts
    connection: {
      statement_timeout: 15000, // Kill queries after 15 seconds
    },
  };
}

// Singleton connection pool
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient() {
  if (!_client) {
    _client = postgres(getConnectionString(), getConnectionOptions());
  }
  return _client;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

// Export singleton db instance via lazy proxy
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle<typeof schema>>];
  },
});

// Export schema for use in queries
export * from "./schema";
