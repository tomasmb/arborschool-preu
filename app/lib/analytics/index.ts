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
  UTMParams,
} from "./types";

// Tracker functions
export {
  initializeTracker,
  trackEvent,
  identifyUser,
  // Convenience functions (funnel events)
  trackLandingPageViewed,
  trackLandingCtaClicked,
  trackDiagnosticIntroViewed,
  trackMiniFormCompleted,
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
  // Utilities
  extractUTMParams,
  getDeviceType,
  getPersistedUTMParams,
} from "./tracker";
