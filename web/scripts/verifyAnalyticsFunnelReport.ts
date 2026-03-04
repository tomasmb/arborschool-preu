import {
  buildCanonicalFunnelInsightDefinition,
  buildWeeklyFunnelReport,
  type FunnelEvent,
} from "@/lib/analytics/funnelReport";
import type { JourneyStateAnalytics } from "@/lib/analytics/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function stageUsers(
  report: ReturnType<typeof buildWeeklyFunnelReport>,
  milestone: string
): number {
  return (
    report.stages.find((stage) => stage.milestone === milestone)?.users ?? 0
  );
}

function findSegmentUsers(params: {
  report: ReturnType<typeof buildWeeklyFunnelReport>;
  milestone: string;
  entryPoint: string;
  journeyState: string;
}): number {
  const stage = params.report.stages.find(
    (value) => value.milestone === params.milestone
  );
  if (!stage) {
    return 0;
  }

  const segment = stage.segmentBreakdown.find(
    (value) =>
      value.entryPoint === params.entryPoint &&
      value.journeyState === params.journeyState
  );

  return segment?.users ?? 0;
}

function milestoneEvent(params: {
  event: FunnelEvent["event"];
  distinctId: string;
  timestamp: string;
  entryPoint: string;
  journeyState: JourneyStateAnalytics;
}): FunnelEvent {
  return {
    event: params.event,
    distinctId: params.distinctId,
    timestamp: params.timestamp,
    properties: {
      entry_point: params.entryPoint,
      journey_state: params.journeyState,
    },
  };
}

function buildUserOneJourneyEvents(): FunnelEvent[] {
  return [
    milestoneEvent({
      event: "landing_cta",
      distinctId: "u1",
      timestamp: "2026-03-02T10:00:00.000Z",
      entryPoint: "/",
      journeyState: "planning_required",
    }),
    milestoneEvent({
      event: "landing_cta",
      distinctId: "u1",
      timestamp: "2026-03-02T10:01:00.000Z",
      entryPoint: "/",
      journeyState: "planning_required",
    }),
    milestoneEvent({
      event: "auth_success",
      distinctId: "u1",
      timestamp: "2026-03-02T10:04:00.000Z",
      entryPoint: "/auth/post-login",
      journeyState: "planning_required",
    }),
    milestoneEvent({
      event: "planning_saved",
      distinctId: "u1",
      timestamp: "2026-03-02T10:12:00.000Z",
      entryPoint: "/portal/goals",
      journeyState: "planning_required",
    }),
    milestoneEvent({
      event: "diagnostic_started",
      distinctId: "u1",
      timestamp: "2026-03-02T10:15:00.000Z",
      entryPoint: "/diagnostico",
      journeyState: "diagnostic_in_progress",
    }),
    milestoneEvent({
      event: "diagnostic_completed",
      distinctId: "u1",
      timestamp: "2026-03-02T10:35:00.000Z",
      entryPoint: "/diagnostico",
      journeyState: "activation_ready",
    }),
    milestoneEvent({
      event: "first_sprint_started",
      distinctId: "u1",
      timestamp: "2026-03-02T11:00:00.000Z",
      entryPoint: "/portal/study",
      journeyState: "activation_ready",
    }),
    milestoneEvent({
      event: "weekly_active",
      distinctId: "u1",
      timestamp: "2026-03-04T11:00:00.000Z",
      entryPoint: "/portal/study",
      journeyState: "active_learning",
    }),
  ];
}

function buildUserTwoJourneyEvents(): FunnelEvent[] {
  return [
    milestoneEvent({
      event: "landing_cta",
      distinctId: "u2",
      timestamp: "2026-03-02T12:00:00.000Z",
      entryPoint: "/",
      journeyState: "diagnostic_in_progress",
    }),
    milestoneEvent({
      event: "auth_success",
      distinctId: "u2",
      timestamp: "2026-03-02T12:03:00.000Z",
      entryPoint: "/auth/post-login",
      journeyState: "diagnostic_in_progress",
    }),
    milestoneEvent({
      event: "diagnostic_started",
      distinctId: "u2",
      timestamp: "2026-03-02T12:06:00.000Z",
      entryPoint: "/diagnostico",
      journeyState: "diagnostic_in_progress",
    }),
  ];
}

function buildIgnoredEvents(): FunnelEvent[] {
  return [
    milestoneEvent({
      event: "landing_cta",
      distinctId: "u3",
      timestamp: "2026-02-28T10:00:00.000Z",
      entryPoint: "/",
      journeyState: "planning_required",
    }),
    {
      event: "mini_form_completed",
      distinctId: "u4",
      timestamp: "2026-03-02T10:00:00.000Z",
      properties: {},
    },
  ];
}

function buildFixtureEvents(): FunnelEvent[] {
  return [
    ...buildUserOneJourneyEvents(),
    ...buildUserTwoJourneyEvents(),
    ...buildIgnoredEvents(),
  ];
}

function assertStageCounts(report: ReturnType<typeof buildWeeklyFunnelReport>) {
  const expectedCounts: Record<string, number> = {
    landing_cta: 2,
    auth_success: 2,
    planning_saved: 1,
    diagnostic_started: 2,
    diagnostic_completed: 1,
    first_sprint_started: 1,
    weekly_active: 1,
  };

  for (const [milestone, expectedCount] of Object.entries(expectedCounts)) {
    assert(
      stageUsers(report, milestone) === expectedCount,
      `${milestone} count mismatch`
    );
  }
}

function assertSegmentCounts(
  report: ReturnType<typeof buildWeeklyFunnelReport>
) {
  assert(
    findSegmentUsers({
      report,
      milestone: "diagnostic_started",
      entryPoint: "/diagnostico",
      journeyState: "diagnostic_in_progress",
    }) === 2,
    "Expected diagnostic_started segment by journey state"
  );

  assert(
    findSegmentUsers({
      report,
      milestone: "weekly_active",
      entryPoint: "/portal/study",
      journeyState: "active_learning",
    }) === 1,
    "Expected weekly_active segment by entry point + state"
  );
}

function assertInsightDefinition() {
  const insight = buildCanonicalFunnelInsightDefinition();
  const expectedMilestones = [
    "landing_cta",
    "auth_success",
    "planning_saved",
    "diagnostic_started",
    "diagnostic_completed",
    "first_sprint_started",
    "weekly_active",
  ];

  assert(
    insight.milestones.join("->") === expectedMilestones.join("->"),
    "Canonical milestone order mismatch"
  );
  assert(
    insight.breakdownProperties.includes("entry_point") &&
      insight.breakdownProperties.includes("journey_state"),
    "Expected insight breakdown by entry and state"
  );
}

function buildSummary(report: ReturnType<typeof buildWeeklyFunnelReport>) {
  return {
    totalUsers: report.totalUsers,
    stageUsers: report.stages.map((stage) => ({
      milestone: stage.milestone,
      users: stage.users,
    })),
  };
}

function printSuccess(report: ReturnType<typeof buildWeeklyFunnelReport>) {
  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks: {
          canonicalMilestoneOrder: "pass",
          weeklyStageAggregation: "pass",
          duplicateUserEventDeduping: "pass",
          segmentByEntryAndState: "pass",
          ignoresLegacyEvents: "pass",
        },
        summary: buildSummary(report),
      },
      null,
      2
    )
  );
}

function main() {
  const report = buildWeeklyFunnelReport(buildFixtureEvents(), {
    weekStartDate: "2026-03-02",
    now: new Date("2026-03-05T12:00:00.000Z"),
  });

  assert(report.weekStartDate === "2026-03-02", "Unexpected weekStartDate");
  assert(report.weekEndDate === "2026-03-09", "Unexpected weekEndDate");
  assert(
    report.totalUsers === 2,
    "Expected two unique users in canonical funnel"
  );

  assertStageCounts(report);
  assertSegmentCounts(report);
  assertInsightDefinition();
  printSuccess(report);
}

main();
