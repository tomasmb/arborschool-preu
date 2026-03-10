import type { AnalyticsEventMap } from "./types";
import { trackEvent } from "./tracker";

const AUTH_SUCCESS_TRACKED_KEY = "arbor_auth_success";
const DIAGNOSTIC_STARTED_ATTEMPTS_KEY = "arbor_diagnostic_started_attempts";

function getTrackedDiagnosticAttemptIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = sessionStorage.getItem(DIAGNOSTIC_STARTED_ATTEMPTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function storeTrackedDiagnosticAttemptIds(attemptIds: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(
      DIAGNOSTIC_STARTED_ATTEMPTS_KEY,
      JSON.stringify(attemptIds.slice(-20))
    );
  } catch {
    // Ignore sessionStorage failures.
  }
}

export function trackLandingCtaClicked(
  ctaLocation: AnalyticsEventMap["landing_cta_clicked"]["cta_location"],
  options: {
    destination: string;
    entryPoint: string;
    journeyState: AnalyticsEventMap["landing_cta"]["journey_state"];
  }
): void {
  trackEvent("landing_cta_clicked", {
    cta_location: ctaLocation,
  });

  trackEvent("landing_cta", {
    cta_location: ctaLocation,
    destination: options.destination,
    entry_point: options.entryPoint,
    journey_state: options.journeyState,
  });
}

export function trackAuthSuccessOnce(params: {
  source: AnalyticsEventMap["auth_success"]["source"];
  entryPoint: string;
  journeyState: AnalyticsEventMap["auth_success"]["journey_state"];
}): void {
  if (typeof window === "undefined") {
    return;
  }

  if (sessionStorage.getItem(AUTH_SUCCESS_TRACKED_KEY) === "1") {
    return;
  }

  sessionStorage.setItem(AUTH_SUCCESS_TRACKED_KEY, "1");
  trackEvent("auth_success", {
    source: params.source,
    entry_point: params.entryPoint,
    journey_state: params.journeyState,
  });
}

export function trackPlanningSavedMilestone(params: {
  mode: AnalyticsEventMap["planning_saved"]["mode"];
  goalCount: number;
  entryPoint: string;
  journeyState: AnalyticsEventMap["planning_saved"]["journey_state"];
}): void {
  trackEvent("planning_saved", {
    mode: params.mode,
    goal_count: params.goalCount,
    entry_point: params.entryPoint,
    journey_state: params.journeyState,
  });
}

export function trackDiagnosticStarted(params: {
  attemptId?: string | null;
  entryPoint: string;
  journeyState: AnalyticsEventMap["diagnostic_started"]["journey_state"];
}): void {
  const attemptId = params.attemptId?.trim() ?? "";

  if (attemptId.length > 0 && typeof window !== "undefined") {
    const tracked = getTrackedDiagnosticAttemptIds();
    if (tracked.includes(attemptId)) {
      return;
    }

    storeTrackedDiagnosticAttemptIds([...tracked, attemptId]);
  }

  trackEvent("diagnostic_started", {
    attempt_id: attemptId || undefined,
    entry_point: params.entryPoint,
    journey_state: params.journeyState,
  });
}

export function trackFirstSprintStarted(params: {
  sprintId: string;
  estimatedMinutes: number;
  itemCount: number;
  entryPoint: string;
  journeyState: AnalyticsEventMap["first_sprint_started"]["journey_state"];
}): void {
  trackEvent("first_sprint_started", {
    sprint_id: params.sprintId,
    estimated_minutes: params.estimatedMinutes,
    item_count: params.itemCount,
    entry_point: params.entryPoint,
    journey_state: params.journeyState,
  });
}

export function trackWeeklyActive(params: {
  weekStartDate: string;
  completedSessions: number;
  targetSessions: number;
  entryPoint: string;
  journeyState: AnalyticsEventMap["weekly_active"]["journey_state"];
}): void {
  trackEvent("weekly_active", {
    week_start_date: params.weekStartDate,
    completed_sessions: params.completedSessions,
    target_sessions: params.targetSessions,
    entry_point: params.entryPoint,
    journey_state: params.journeyState,
  });
}
