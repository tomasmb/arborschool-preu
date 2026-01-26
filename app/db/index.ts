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

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[db] Missing required environment variable: ${name}`);
  }
  return value;
}

// Build connection string based on environment
function getConnectionConfig() {
  // If DATABASE_URL is provided directly, use it
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  // Otherwise, build from individual components
  const user = isProduction()
    ? requireEnv("DB_USER")
    : process.env.DB_USER || "preu_app";
  const password = isProduction()
    ? requireEnv("DB_PASSWORD")
    : process.env.DB_PASSWORD || "";
  const host = isProduction()
    ? requireEnv("DB_HOST")
    : process.env.DB_HOST || "localhost";
  const database = isProduction()
    ? requireEnv("DB_NAME")
    : process.env.DB_NAME || "preu";
  const port = isProduction()
    ? process.env.DB_PORT
    : process.env.DB_PORT || "5432";

  // Cloud Run uses Unix socket via Cloud SQL Auth Proxy
  if (host.startsWith("/cloudsql/")) {
    return { host, database, username: user, password };
  }

  const parsedPort = port ? Number.parseInt(port, 10) : 5432;
  return { host, port: parsedPort, database, username: user, password };
}

function getPoolMax(): number {
  const raw = isProduction()
    ? requireEnv("DB_POOL_MAX")
    : process.env.DB_POOL_MAX;
  if (!raw) return 5;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 5;
  return parsed;
}

function getConnectionOptions(): {
  max: number;
  idle_timeout: number;
  connect_timeout: number;
  max_lifetime: number;
  keep_alive: number;
  connection: { statement_timeout: number };
  onclose: (connectionId: number) => void;
} {
  // Connection pool options
  // Cloud Run instances can handle multiple concurrent requests
  // Pool size is per-instance. Keep headroom vs Cloud SQL max_connections.
  return {
    max: getPoolMax(), // Pool connections per instance (configurable)
    // Close idle connections quickly to avoid stale sockets on low traffic.
    idle_timeout: 30,
    // Cloud Run cold starts and Cloud SQL maintenance can make connects slower.
    connect_timeout: 30,
    // Recycle long-lived connections (helps with maintenance / NAT / idle resets).
    max_lifetime: 1800,
    // TCP keepalive interval in seconds (ignored for Unix sockets).
    keep_alive: 60,
    connection: {
      statement_timeout: 15000, // Kill queries after 15 seconds
    },
    onclose: (connectionId: number) => {
      if (!isProduction()) return;
      console.warn(`[db] connection closed (id=${connectionId})`);
    },
  };
}

// Singleton connection pool - created once, reused for all requests
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient() {
  if (!_client) {
    const config = getConnectionConfig();
    const options = getConnectionOptions();
    if (config.connectionString) {
      _client = postgres(config.connectionString, options);
    } else {
      _client = postgres({ ...config, ...options });
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
