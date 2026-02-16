import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a3dfef3ce43fe50e16613151734ad776@o4510823802798080.ingest.us.sentry.io/4510823804043264",

  // Enable structured logging
  enableLogs: true,

  // Performance monitoring sample rate (0.0 to 1.0)
  tracesSampleRate: 0.1,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  integrations: [
    // Capture console.warn and console.error as Sentry logs
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),

    // Session replay for debugging errors
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session replay sample rates
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Filter out noisy errors
  ignoreErrors: [
    /extensions\//i,
    /^chrome:\/\//i,
    "Network request failed",
    "Failed to fetch",
    "Load failed",
  ],
});
