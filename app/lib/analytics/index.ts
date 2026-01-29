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
  SignupIntent,
  UTMParams,
} from "./types";

// Tracker functions
export {
  initializeTracker,
  trackEvent,
  // Convenience functions (funnel events)
  trackLandingPageViewed,
  trackLandingCtaClicked,
  trackDiagnosticIntroViewed,
  trackDiagnosticStarted,
  trackDiagnosticCompleted,
  trackResultsViewed,
  trackResultsCtaClicked,
  trackSignupCompleted,
  // Utilities
  extractUTMParams,
  getDeviceType,
  getPersistedUTMParams,
} from "./tracker";
