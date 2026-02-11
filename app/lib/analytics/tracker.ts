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

/** Callback type for identifying users */
type IdentifyFunction = (
  distinctId: string,
  properties?: Record<string, unknown>
) => void;

let captureFunction: CaptureFunction | null = null;
let identifyFunction: IdentifyFunction | null = null;

/**
 * Initializes the analytics tracker with capture and identify functions.
 * Called by PostHogProvider after PostHog is initialized.
 */
export function initializeTracker(
  capture: CaptureFunction,
  identify?: IdentifyFunction
): void {
  captureFunction = capture;
  identifyFunction = identify || null;
}

/**
 * Identifies a user in the analytics system.
 * Links all previous anonymous events to this user.
 * Call this when a user signs up or logs in.
 */
export function identifyUser(
  email: string,
  properties?: Record<string, unknown>
): void {
  if (!identifyFunction) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] identify", email, properties);
    }
    return;
  }

  identifyFunction(email, { email, ...properties });
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
 * Tracks diagnostic completion. Call when user finishes Q16.
 */
export function trackDiagnosticCompleted(
  totalCorrect: number,
  performanceTier: AnalyticsEventMap["diagnostic_completed"]["performance_tier"],
  route: AnalyticsEventMap["diagnostic_completed"]["route"]
): void {
  trackEvent("diagnostic_completed", {
    total_correct: totalCorrect,
    performance_tier: performanceTier,
    time_elapsed_seconds: getDiagnosticElapsedSeconds(),
    route,
  });
}

/**
 * Tracks partial results screen view (gated screen before profiling).
 * Call when partial results screen mounts.
 */
export function trackPartialResultsViewed(
  paesScoreMin: number,
  paesScoreMax: number,
  performanceTier: AnalyticsEventMap["partial_results_viewed"]["performance_tier"],
  totalCorrect: number
): void {
  trackEvent("partial_results_viewed", {
    paes_score_min: paesScoreMin,
    paes_score_max: paesScoreMax,
    performance_tier: performanceTier,
    total_correct: totalCorrect,
  });
}

/**
 * Tracks CTA click on partial results screen. Call when user clicks to continue to profiling.
 */
export function trackPartialResultsCtaClicked(
  performanceTier: AnalyticsEventMap["partial_results_cta_clicked"]["performance_tier"],
  ctaLabel: string
): void {
  trackEvent("partial_results_cta_clicked", {
    performance_tier: performanceTier,
    cta_label: ctaLabel,
  });
}

/**
 * Tracks full results screen view. Call when results screen mounts.
 */
export function trackResultsViewed(
  paesScoreMin: number,
  paesScoreMax: number,
  performanceTier: AnalyticsEventMap["results_viewed"]["performance_tier"],
  totalCorrect: number,
  route: AnalyticsEventMap["results_viewed"]["route"]
): void {
  trackEvent("results_viewed", {
    paes_score_min: paesScoreMin,
    paes_score_max: paesScoreMax,
    performance_tier: performanceTier,
    total_correct: totalCorrect,
    route,
  });
}

/**
 * Tracks when user expands "Explorar mi ruta personalizada" on results screen.
 */
export function trackRouteExplored(
  performanceTier: AnalyticsEventMap["route_explored"]["performance_tier"],
  route: AnalyticsEventMap["route_explored"]["route"]
): void {
  trackEvent("route_explored", {
    performance_tier: performanceTier,
    route,
  });
}

/**
 * Tracks mini-form completion (email + role + curso, before test).
 * Also identifies the user and marks the diagnostic start time,
 * since form submission IS the test start (single user action).
 */
export function trackMiniFormCompleted(
  email: string,
  userType: string,
  curso: string
): void {
  // Identify the user early (since we now have their email)
  identifyUser(email, { user_type: userType, curso });

  // Mark diagnostic start time (for elapsed time calculation later)
  markDiagnosticStart();

  const utmParams = getPersistedUTMParams();

  trackEvent("mini_form_completed", {
    email,
    user_type: userType,
    curso,
    ...utmParams,
  });
}

/**
 * Tracks profiling form completion (optional fields after test).
 */
export function trackProfilingCompleted(filledFields: {
  paesGoal: boolean;
  paesDate: boolean;
  inPreu: boolean;
}): void {
  trackEvent("profiling_completed", {
    paes_goal_filled: filledFields.paesGoal,
    paes_date_filled: filledFields.paesDate,
    in_preu_filled: filledFields.inPreu,
  });

  // Clean up diagnostic timer (flow is complete)
  clearDiagnosticStartTime();
}

/**
 * Tracks when user sees the confirm-skip screen (considering exiting).
 */
export function trackConfirmSkipViewed(): void {
  trackEvent("confirm_skip_viewed", {});
}

/**
 * Tracks when user confirms exit on the confirm-skip screen.
 */
export function trackConfirmSkipExit(): void {
  trackEvent("confirm_skip_exit", {});

  // Clean up diagnostic timer (flow is complete)
  clearDiagnosticStartTime();
}

/**
 * Tracks when user goes back to profiling from confirm-skip screen.
 */
export function trackConfirmSkipBackToProfiling(): void {
  trackEvent("confirm_skip_back_to_profiling", {});
}

/**
 * Tracks stage 1 completion — user finished the 8 routing questions.
 * Key mid-funnel event for understanding test drop-off.
 */
export function trackStage1Completed(
  correctCount: number,
  assignedRoute: AnalyticsEventMap["stage_1_completed"]["assigned_route"]
): void {
  trackEvent("stage_1_completed", {
    correct_count: correctCount,
    assigned_route: assignedRoute,
  });
}

/**
 * Tracks when the 30-minute timer expires.
 * Critical for understanding test difficulty and time allocation.
 */
export function trackTimeExpired(
  stage: 1 | 2,
  questionIndex: number,
  questionsAnswered: number
): void {
  trackEvent("time_expired", {
    stage,
    question_index: questionIndex,
    questions_answered: questionsAnswered,
  });
}
