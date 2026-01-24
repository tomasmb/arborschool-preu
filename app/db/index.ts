import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

/**
 * Database connection singleton for the application.
 * Uses postgres.js driver with Drizzle ORM.
 *
 * In production (Cloud Run), connects via Unix socket to Cloud SQL Auth Proxy.
 * In development, connects via TCP to local database or Cloud SQL Auth Proxy.
 *
 * Uses lazy initialization to avoid connection issues in serverless environments.
 */

// Build connection options based on environment
interface ConnectionConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

function getConnectionConfig(): ConnectionConfig {
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
  // postgres.js requires host to be the socket path directly
  if (host.startsWith("/cloudsql/")) {
    return {
      host,
      database,
      username: user,
      password,
    };
  }

  return {
    host,
    port: parseInt(port, 10),
    database,
    username: user,
    password,
  };
}

// Connection options for serverless (Cloud Run)
// IMPORTANT: We disable pooling to avoid stale connection issues with Cloud SQL
// Auth Proxy Unix sockets. Each request gets a fresh connection.
// This adds ~10-50ms latency but is 100% reliable.
const CONNECTION_OPTIONS = {
  max: 1, // Single connection per request - no pooling
  idle_timeout: 0, // Close connection immediately when idle
  connect_timeout: 10, // Fail connection attempts after 10s
  // Set PostgreSQL statement timeout - kills queries after 15 seconds
  connection: {
    statement_timeout: 15000,
  },
};

/**
 * Get the database instance.
 * Creates a fresh connection each time to avoid stale connection issues
 * with Cloud SQL Auth Proxy in serverless environments.
 */
export function getDb() {
  const config = getConnectionConfig();

  // Create fresh connection each time
  let client: Sql;
  if (config.connectionString) {
    client = postgres(config.connectionString, CONNECTION_OPTIONS);
  } else {
    client = postgres({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ...CONNECTION_OPTIONS,
    });
  }

  return drizzle(client, { schema });
}

// For convenience, export a proxy that lazily initializes
// This allows `import { db } from './db'` syntax while still being lazy
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle<typeof schema>>];
  },
});

// Export schema for use in queries
export * from "./schema";
