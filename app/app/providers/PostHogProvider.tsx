"use client";

/**
 * PostHog Provider
 *
 * Initializes PostHog analytics and connects it to our tracker interface.
 * Uses useRef guard to prevent double initialization in React Strict Mode.
 *
 * @see temp-docs/conversion-optimization-implementation.md#installation
 */

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { initializeTracker } from "@/lib/analytics";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Skip if already initialized or no environment variables
    if (initialized.current) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    // In development without keys, just initialize tracker with console logging
    if (!posthogKey) {
      if (process.env.NODE_ENV === "development") {
        console.log("[PostHog] No API key found, analytics disabled");
      }
      initialized.current = true;
      return;
    }

    // Initialize PostHog
    posthog.init(posthogKey, {
      api_host: posthogHost || "https://us.i.posthog.com",
      // Disable automatic pageview capture - we track manually
      capture_pageview: false,
      // Respect Do Not Track browser setting
      respect_dnt: true,
      // Disable session recording by default (can enable later)
      disable_session_recording: true,
    });

    // Register global properties (attached to all events)
    const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION;
    if (buildVersion) {
      posthog.register({ build_version: buildVersion });
    }

    // Connect PostHog to our tracker interface
    initializeTracker((eventName, properties) => {
      posthog.capture(eventName, properties);
    });

    initialized.current = true;
  }, []);

  return <>{children}</>;
}
