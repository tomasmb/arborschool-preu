import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a3dfef3ce43fe50e16613151734ad776@o4510823802798080.ingest.us.sentry.io/4510823804043264",

  enableLogs: true,

  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === "production",

  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  ignoreErrors: [
    /extensions\//i,
    /^chrome:\/\//i,
    "Network request failed",
    "Failed to fetch",
    "Load failed",
  ],
});

// Lazy-load the replay bundle — only fetched when the session is
// sampled for replay (~10% of sessions, 100% on error).
Sentry.lazyLoadIntegration("replayIntegration").then((replay) => {
  Sentry.addIntegration(
    replay({ maskAllText: true, blockAllMedia: true })
  );
});
