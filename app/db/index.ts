import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database connection singleton for the application.
 * Uses postgres.js driver with Drizzle ORM.
 *
 * In production (Cloud Run), connects via Unix socket to Cloud SQL Auth Proxy.
 * In development, connects via TCP to local database or Cloud SQL Auth Proxy.
 *
 * Uses a true singleton pattern - one connection pool shared across all requests.
 */

// Build connection string based on environment
function getConnectionConfig() {
  // If DATABASE_URL is provided directly, use it
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  // Otherwise, build from individual components
  const user = process.env.DB_USER || "preu_app";
  const password = process.env.DB_PASSWORD || "";
  const host = process.env.DB_HOST || "localhost";
  const database = process.env.DB_NAME || "preu";
  const port = process.env.DB_PORT || "5432";

  // Cloud Run uses Unix socket via Cloud SQL Auth Proxy
  if (host.startsWith("/cloudsql/")) {
    return { host, database, username: user, password };
  }

  return { host, port: parseInt(port, 10), database, username: user, password };
}

// Connection pool options
// Cloud Run instances can handle multiple concurrent requests
// Pool size is per-instance, so with max 10 instances * 10 connections = 100 max
const CONNECTION_OPTIONS = {
  max: 10, // Pool up to 10 connections per instance
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 10, // Fail connection attempts after 10s
  connection: {
    statement_timeout: 15000, // Kill queries after 15 seconds
  },
};

// Singleton connection pool - created once, reused for all requests
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient() {
  if (!_client) {
    const config = getConnectionConfig();
    if (config.connectionString) {
      _client = postgres(config.connectionString, CONNECTION_OPTIONS);
    } else {
      _client = postgres({ ...config, ...CONNECTION_OPTIONS });
    }
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
