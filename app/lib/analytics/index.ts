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
  trackDiagnosticStarted,
  trackDiagnosticCompleted,
  trackPartialResultsViewed,
  trackPartialResultsCtaClicked,
  trackResultsViewed,
  trackRouteExplored,
  trackMiniFormCompleted,
  trackProfilingCompleted,
  trackProfilingSkipped,
  // Utilities
  extractUTMParams,
  getDeviceType,
  getPersistedUTMParams,
} from "./tracker";
