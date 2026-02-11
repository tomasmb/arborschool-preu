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
}

/** Route details expanded event - user clicked "Explorar mi ruta personalizada" */
export interface RouteExploredProperties extends BaseEventProperties {
  performance_tier: PerformanceTier;
  route: "A" | "B" | "C";
}

/** Partial results viewed event - gated screen before profiling */
export interface PartialResultsViewedProperties extends BaseEventProperties {
  paes_score_min: number;
  paes_score_max: number;
  performance_tier: PerformanceTier;
  total_correct: number;
}

/** Partial results CTA clicked - user clicks to continue to profiling */
export interface PartialResultsCtaClickedProperties
  extends BaseEventProperties {
  performance_tier: PerformanceTier;
  cta_label: string;
}

/** Mini-form completed event (email + role + curso, before test) */
export interface MiniFormCompletedProperties extends BaseEventProperties {
  email: string;
  user_type: string;
  curso: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/** Profiling completed event (optional fields after test) */
export interface ProfilingCompletedProperties extends BaseEventProperties {
  paes_goal_filled: boolean;
  paes_date_filled: boolean;
  in_preu_filled: boolean;
}

/** Confirm skip screen viewed — user is considering exiting */
export type ConfirmSkipViewedProperties = BaseEventProperties;

/** Confirm skip exit — user confirmed they want to leave */
export type ConfirmSkipExitProperties = BaseEventProperties;

/** Confirm skip back to profiling — user changed their mind */
export type ConfirmSkipBackToProfilingProperties = BaseEventProperties;

/** Stage 1 completed — user finished the 8 routing questions */
export interface Stage1CompletedProperties extends BaseEventProperties {
  /** Number of correct answers in stage 1 (0-8) */
  correct_count: number;
  /** Route assigned based on stage 1 performance */
  assigned_route: "A" | "B" | "C";
}

/** Time expired — the 30-minute timer ran out */
export interface TimeExpiredProperties extends BaseEventProperties {
  /** Current stage when time expired (1 or 2) */
  stage: 1 | 2;
  /** 0-based index of the question the user was on */
  question_index: number;
  /** Total questions answered before time expired */
  questions_answered: number;
}

// ============================================================================
// EVENT NAMES (14 core funnel events)
// ============================================================================

export type AnalyticsEventName =
  | "landing_page_viewed"
  | "landing_cta_clicked"
  | "diagnostic_intro_viewed"
  | "mini_form_completed"
  | "diagnostic_completed"
  | "stage_1_completed"
  | "time_expired"
  | "partial_results_viewed"
  | "partial_results_cta_clicked"
  | "results_viewed"
  | "route_explored"
  | "profiling_completed"
  | "confirm_skip_viewed"
  | "confirm_skip_exit"
  | "confirm_skip_back_to_profiling";

// ============================================================================
// EVENT MAP (for type-safe event tracking)
// ============================================================================

export interface AnalyticsEventMap {
  landing_page_viewed: LandingPageViewedProperties;
  landing_cta_clicked: LandingCtaClickedProperties;
  diagnostic_intro_viewed: DiagnosticIntroViewedProperties;
  mini_form_completed: MiniFormCompletedProperties;
  diagnostic_completed: DiagnosticCompletedProperties;
  stage_1_completed: Stage1CompletedProperties;
  time_expired: TimeExpiredProperties;
  partial_results_viewed: PartialResultsViewedProperties;
  partial_results_cta_clicked: PartialResultsCtaClickedProperties;
  results_viewed: ResultsViewedProperties;
  route_explored: RouteExploredProperties;
  profiling_completed: ProfilingCompletedProperties;
  confirm_skip_viewed: ConfirmSkipViewedProperties;
  confirm_skip_exit: ConfirmSkipExitProperties;
  confirm_skip_back_to_profiling: ConfirmSkipBackToProfilingProperties;
}
