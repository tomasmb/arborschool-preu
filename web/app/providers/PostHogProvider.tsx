"use client";

/**
 * PostHog Provider
 *
 * Lazily loads PostHog analytics via dynamic import to keep it out of the
 * critical bundle (~45KB gzipped). Initialization happens after first paint
 * via useEffect, so it never blocks FCP/LCP.
 */

import { useEffect, useRef } from "react";
import { initializeTracker } from "@/lib/analytics";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey) {
      if (process.env.NODE_ENV === "development") {
        console.log("[PostHog] No API key found, analytics disabled");
      }
      return;
    }

    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: posthogHost || "https://us.i.posthog.com",
        capture_pageview: false,
        respect_dnt: true,
        disable_session_recording: false,
      });

      const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION;
      const isPreview = window.location.hostname.includes("vercel.app");
      posthog.register({
        ...(buildVersion && { build_version: buildVersion }),
        environment: isPreview ? "preview" : "production",
      });

      initializeTracker(
        (eventName, properties) => {
          posthog.capture(eventName, properties);
        },
        (distinctId, properties) => {
          posthog.identify(distinctId, properties);
        }
      );
    });
  }, []);

  return <>{children}</>;
}
