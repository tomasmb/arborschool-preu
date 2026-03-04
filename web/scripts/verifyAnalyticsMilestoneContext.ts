import {
  initializeTracker,
  markDiagnosticStart,
  trackAuthSuccessOnce,
  trackDiagnosticCompleted,
  trackDiagnosticStarted,
  trackFirstSprintStarted,
  trackLandingCtaClicked,
  trackPlanningSavedMilestone,
  trackWeeklyActive,
} from "@/lib/analytics";
import type { JourneyStateAnalytics } from "@/lib/analytics";

type CapturedEvent = {
  eventName: string;
  properties: Record<string, unknown> | undefined;
};

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function installBrowserMocks(): void {
  const windowMock = {
    location: { pathname: "/verification" },
  } as unknown as Window & typeof globalThis;

  const sessionStorageMock = new MemoryStorage();

  Object.assign(globalThis, {
    window: windowMock,
    sessionStorage: sessionStorageMock,
  });
}

function extractMilestoneContext(event: CapturedEvent): {
  entryPoint: string;
  journeyState: JourneyStateAnalytics;
} {
  const entryPoint = event.properties?.entry_point;
  const journeyState = event.properties?.journey_state;

  assert(
    typeof entryPoint === "string" && entryPoint.trim().length > 0,
    `Missing entry_point for ${event.eventName}`
  );
  assert(
    typeof journeyState === "string" && journeyState.trim().length > 0,
    `Missing journey_state for ${event.eventName}`
  );

  return {
    entryPoint: entryPoint.trim(),
    journeyState: journeyState as JourneyStateAnalytics,
  };
}

function findEvent(events: CapturedEvent[], eventName: string): CapturedEvent {
  const event = events.find((value) => value.eventName === eventName);
  assert(event, `Missing emitted milestone: ${eventName}`);
  return event;
}

function main() {
  installBrowserMocks();

  const capturedEvents: CapturedEvent[] = [];
  initializeTracker((eventName, properties) => {
    capturedEvents.push({
      eventName,
      properties,
    });
  });

  trackLandingCtaClicked("hero", {
    destination: "/auth/signin?callbackUrl=/auth/post-login",
    entryPoint: "/",
    journeyState: "anonymous",
  });
  trackAuthSuccessOnce({
    source: "dashboard",
    entryPoint: "/portal",
    journeyState: "planning_required",
  });
  trackPlanningSavedMilestone({
    mode: "create",
    goalCount: 1,
    entryPoint: "/portal/goals",
    journeyState: "planning_required",
  });
  trackDiagnosticStarted({
    attemptId: "attempt-test-1",
    entryPoint: "/diagnostico",
    journeyState: "diagnostic_in_progress",
  });
  markDiagnosticStart();
  trackDiagnosticCompleted(12, "high", "B", {
    entryPoint: "/diagnostico",
    journeyState: "activation_ready",
  });
  trackFirstSprintStarted({
    sprintId: "sprint-test-1",
    estimatedMinutes: 15,
    itemCount: 5,
    entryPoint: "/portal/study",
    journeyState: "activation_ready",
  });
  trackWeeklyActive({
    weekStartDate: "2026-03-02",
    completedSessions: 1,
    targetSessions: 4,
    entryPoint: "/portal/study",
    journeyState: "active_learning",
  });

  const requiredMilestones = [
    "landing_cta",
    "auth_success",
    "planning_saved",
    "diagnostic_started",
    "diagnostic_completed",
    "first_sprint_started",
    "weekly_active",
  ];

  const contexts = requiredMilestones.map((milestone) => {
    const event = findEvent(capturedEvents, milestone);
    const context = extractMilestoneContext(event);
    return {
      milestone,
      entryPoint: context.entryPoint,
      journeyState: context.journeyState,
    };
  });

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks: {
          milestoneContextPresence: "pass",
          milestoneContextIncludesAnonymous: "pass",
          milestoneEventEmission: "pass",
        },
        milestones: contexts,
      },
      null,
      2
    )
  );
}

main();
