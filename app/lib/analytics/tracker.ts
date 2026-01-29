/**
 * Analytics Tracker
 *
 * Clean interface for tracking analytics events. Abstracts PostHog
 * so components don't depend directly on the analytics provider.
 *
 * Follows Dependency Inversion Principle - depend on abstractions.
 */

import type {
  AnalyticsEventMap,
  AnalyticsEventName,
  DeviceType,
  UTMParams,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const UTM_STORAGE_KEY = "arbor_utms";
const DIAGNOSTIC_START_TIME_KEY = "arbor_diagnostic_start";

// ============================================================================
// UTM HANDLING
// ============================================================================

/**
 * Extracts UTM parameters from the current URL.
 */
export function extractUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  };
}

/**
 * Persists UTM parameters in session storage for later use.
 */
export function persistUTMParams(params: UTMParams): void {
  if (typeof window === "undefined") return;

  // Only persist if we have at least one UTM param
  if (params.utm_source || params.utm_medium || params.utm_campaign) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
  }
}

/**
 * Retrieves persisted UTM parameters.
 */
export function getPersistedUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

/**
 * Detects the device type based on screen width.
 */
export function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

// ============================================================================
// TIME TRACKING
// ============================================================================

/**
 * Stores the diagnostic start time.
 */
export function markDiagnosticStart(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DIAGNOSTIC_START_TIME_KEY, Date.now().toString());
}

/**
 * Gets the elapsed time since diagnostic start in seconds.
 */
export function getDiagnosticElapsedSeconds(): number {
  if (typeof window === "undefined") return 0;

  const startTime = sessionStorage.getItem(DIAGNOSTIC_START_TIME_KEY);
  if (!startTime) return 0;

  return Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
}

/**
 * Clears the diagnostic start time.
 */
export function clearDiagnosticStartTime(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DIAGNOSTIC_START_TIME_KEY);
}

// ============================================================================
// ANALYTICS TRACKER
// ============================================================================

/** Callback type for the underlying analytics provider */
type CaptureFunction = (
  eventName: string,
  properties?: Record<string, unknown>
) => void;

let captureFunction: CaptureFunction | null = null;

/**
 * Initializes the analytics tracker with a capture function.
 * Called by PostHogProvider after PostHog is initialized.
 */
export function initializeTracker(capture: CaptureFunction): void {
  captureFunction = capture;
}

/**
 * Tracks an analytics event with type-safe properties.
 *
 * @param eventName - The event name (from AnalyticsEventName)
 * @param properties - Event properties (type-checked against AnalyticsEventMap)
 */
export function trackEvent<T extends AnalyticsEventName>(
  eventName: T,
  properties: AnalyticsEventMap[T]
): void {
  if (!captureFunction) {
    // In development, log to console if PostHog not initialized
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", eventName, properties);
    }
    return;
  }

  captureFunction(eventName, properties as Record<string, unknown>);
}

// ============================================================================
// CONVENIENCE FUNCTIONS (MVP Events)
// ============================================================================

/**
 * Tracks landing page view. Call on landing page mount.
 */
export function trackLandingPageViewed(): void {
  const utmParams = extractUTMParams();
  persistUTMParams(utmParams);

  trackEvent("landing_page_viewed", {
    device_type: getDeviceType(),
    ...utmParams,
  });
}

/**
 * Tracks landing CTA click. Call when user clicks any CTA to go to diagnostic.
 */
export function trackLandingCtaClicked(
  ctaLocation: AnalyticsEventMap["landing_cta_clicked"]["cta_location"]
): void {
  trackEvent("landing_cta_clicked", {
    cta_location: ctaLocation,
  });
}

/**
 * Tracks diagnostic intro/welcome screen view. Call when welcome screen mounts.
 */
export function trackDiagnosticIntroViewed(): void {
  trackEvent("diagnostic_intro_viewed", {
    device_type: getDeviceType(),
  });
}

/**
 * Tracks diagnostic start. Call when user clicks "Comenzar".
 */
export function trackDiagnosticStarted(): void {
  markDiagnosticStart();
  const utmParams = getPersistedUTMParams();

  trackEvent("diagnostic_started", {
    ...utmParams,
  });
}

/**
 * Tracks diagnostic completion. Call when user finishes Q16.
 */
export function trackDiagnosticCompleted(
  totalCorrect: number,
  performanceTier: AnalyticsEventMap["diagnostic_completed"]["performance_tier"]
): void {
  trackEvent("diagnostic_completed", {
    total_correct: totalCorrect,
    performance_tier: performanceTier,
    time_elapsed_seconds: getDiagnosticElapsedSeconds(),
  });
}

/**
 * Tracks results screen view. Call when results screen mounts.
 */
export function trackResultsViewed(
  paesScoreMin: number,
  paesScoreMax: number,
  performanceTier: AnalyticsEventMap["results_viewed"]["performance_tier"],
  totalCorrect: number,
  ctaLabel: string
): void {
  trackEvent("results_viewed", {
    paes_score_min: paesScoreMin,
    paes_score_max: paesScoreMax,
    performance_tier: performanceTier,
    total_correct: totalCorrect,
    cta_label: ctaLabel,
  });
}

/**
 * Tracks CTA click on results screen. Call when user clicks signup CTA.
 */
export function trackResultsCtaClicked(
  performanceTier: AnalyticsEventMap["results_cta_clicked"]["performance_tier"],
  ctaLabel: string
): void {
  trackEvent("results_cta_clicked", {
    performance_tier: performanceTier,
    cta_label: ctaLabel,
    signup_intent: "access_waitlist",
  });
}

/**
 * Tracks successful signup. Call after email is submitted successfully.
 */
export function trackSignupCompleted(
  paesScoreMin: number,
  paesScoreMax: number,
  performanceTier: AnalyticsEventMap["signup_completed"]["performance_tier"]
): void {
  const utmParams = getPersistedUTMParams();

  trackEvent("signup_completed", {
    paes_score_min: paesScoreMin,
    paes_score_max: paesScoreMax,
    performance_tier: performanceTier,
    signup_intent: "access_waitlist",
    ...utmParams,
  });

  // Clean up after successful signup
  clearDiagnosticStartTime();
}
