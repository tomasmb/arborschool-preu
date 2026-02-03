import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a3dfef3ce43fe50e16613151734ad776@o4510823802798080.ingest.us.sentry.io/4510823804043264",

  // Enable structured logging
  enableLogs: true,

  // Performance monitoring sample rate
  tracesSampleRate: 0.1,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  integrations: [
    // Capture console.warn and console.error as Sentry logs
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
});
