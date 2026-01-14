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

// Singleton instances for connection reuse
let client: Sql | null = null;
let drizzleInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the database instance with lazy initialization.
 * Reuses existing connection in serverless environments.
 */
export function getDb() {
  if (!drizzleInstance) {
    const config = getConnectionConfig();

    // postgres.js accepts either a connection string or an options object
    if (config.connectionString) {
      client = postgres(config.connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
    } else {
      client = postgres({
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
    }

    drizzleInstance = drizzle(client, { schema });
  }
  return drizzleInstance;
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
