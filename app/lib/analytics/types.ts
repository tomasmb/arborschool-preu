/**
 * Analytics Event Types
 *
 * Type definitions for all analytics events. This provides type safety
 * and serves as documentation for the event schema.
 *
 * @see temp-docs/conversion-optimization-implementation.md#analytics-specification
 */

import type { PerformanceTier } from "@/lib/config/tiers";

// ============================================================================
// UTM PARAMETERS
// ============================================================================

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// ============================================================================
// DEVICE INFO
// ============================================================================

export type DeviceType = "mobile" | "tablet" | "desktop";

// ============================================================================
// SIGNUP INTENT
// ============================================================================

/**
 * Distinguishes waitlist conversion from future product signup.
 * Update to 'create_account' when platform launches.
 */
export type SignupIntent = "access_waitlist" | "create_account";

// ============================================================================
// EVENT PROPERTIES
// ============================================================================

/** Base properties included in all events (added automatically) */
export interface BaseEventProperties {
  build_version?: string;
}

/** Landing page viewed event */
export interface LandingPageViewedProperties extends BaseEventProperties {
  device_type: DeviceType;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/** Landing CTA clicked event - user clicks to go to diagnostic */
export interface LandingCtaClickedProperties extends BaseEventProperties {
  cta_location: "hero" | "navbar" | "bottom" | "other";
}

/** Diagnostic intro viewed event - user sees welcome screen */
export interface DiagnosticIntroViewedProperties extends BaseEventProperties {
  device_type: DeviceType;
}

/** Diagnostic started event */
export interface DiagnosticStartedProperties extends BaseEventProperties {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/** Diagnostic completed event */
export interface DiagnosticCompletedProperties extends BaseEventProperties {
  total_correct: number;
  performance_tier: PerformanceTier;
  time_elapsed_seconds: number;
  /** MST route taken: A=Fundamental, B=Intermedio, C=Avanzado */
  route: "A" | "B" | "C";
}

/** Results viewed event */
export interface ResultsViewedProperties extends BaseEventProperties {
  paes_score_min: number;
  paes_score_max: number;
  performance_tier: PerformanceTier;
  total_correct: number;
  /** MST route taken: A=Fundamental, B=Intermedio, C=Avanzado */
  route: "A" | "B" | "C";
  cta_label: string;
}

/** Results CTA clicked event */
export interface ResultsCtaClickedProperties extends BaseEventProperties {
  performance_tier: PerformanceTier;
  cta_label: string;
  signup_intent: SignupIntent;
}

/** Signup completed event */
export interface SignupCompletedProperties extends BaseEventProperties {
  email: string;
  paes_score_min: number;
  paes_score_max: number;
  performance_tier: PerformanceTier;
  total_correct: number;
  /** MST route taken: A=Fundamental, B=Intermedio, C=Avanzado */
  route: "A" | "B" | "C";
  time_elapsed_seconds: number;
  signup_intent: SignupIntent;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// ============================================================================
// EVENT NAMES (8 core funnel events)
// ============================================================================

export type AnalyticsEventName =
  | "landing_page_viewed"
  | "landing_cta_clicked"
  | "diagnostic_intro_viewed"
  | "diagnostic_started"
  | "diagnostic_completed"
  | "results_viewed"
  | "results_cta_clicked"
  | "signup_completed";

// ============================================================================
// EVENT MAP (for type-safe event tracking)
// ============================================================================

export interface AnalyticsEventMap {
  landing_page_viewed: LandingPageViewedProperties;
  landing_cta_clicked: LandingCtaClickedProperties;
  diagnostic_intro_viewed: DiagnosticIntroViewedProperties;
  diagnostic_started: DiagnosticStartedProperties;
  diagnostic_completed: DiagnosticCompletedProperties;
  results_viewed: ResultsViewedProperties;
  results_cta_clicked: ResultsCtaClickedProperties;
  signup_completed: SignupCompletedProperties;
}
