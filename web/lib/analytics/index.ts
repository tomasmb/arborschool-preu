/**
 * Analytics Module Exports
 *
 * Central point for all analytics functionality.
 * Components should import from here for cleaner imports.
 */

// Types
export type {
  AnalyticsEventName,
  AnalyticsEventMap,
  DeviceType,
  JourneyStateAnalytics,
  UTMParams,
} from "./types";
export {
  CANONICAL_FUNNEL_MILESTONES,
  buildWeeklyFunnelReport,
  buildCanonicalFunnelInsightDefinition,
} from "./funnelReport";

// Tracker functions
export {
  trackLandingCtaClicked,
  trackAuthSuccessOnce,
  trackPlanningSavedMilestone,
  trackDiagnosticStarted,
  trackFirstSprintStarted,
  trackWeeklyActive,
} from "./milestones";

export {
  initializeTracker,
  trackEvent,
  identifyUser,
  // Convenience functions (funnel events)
  trackLandingPageViewed,
  markDiagnosticStart,
  trackDiagnosticIntroViewed,
  trackDiagnosticCompleted,
  trackStage1Completed,
  trackTimeExpired,
  trackPartialResultsViewed,
  trackPartialResultsCtaClicked,
  trackResultsViewed,
  trackRouteExplored,
  trackProfilingCompleted,
  trackConfirmSkipViewed,
  trackConfirmSkipExit,
  trackConfirmSkipBackToProfiling,
  trackStudentGoalsSaved,
  trackStudentSimulatorInteraction,
  trackStudentDashboardViewed,
  trackStudentNextActionClicked,
  // Utilities
  extractUTMParams,
  getDeviceType,
  getPersistedUTMParams,
} from "./tracker";
