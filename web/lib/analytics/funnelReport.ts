import type { JourneyStateAnalytics } from "./types";

export const CANONICAL_FUNNEL_MILESTONES = [
  "landing_cta",
  "auth_success",
  "planning_saved",
  "diagnostic_started",
  "diagnostic_completed",
  "first_sprint_started",
  "weekly_active",
] as const;

export type CanonicalFunnelMilestone =
  (typeof CANONICAL_FUNNEL_MILESTONES)[number];

type DateLike = Date | string;

export type FunnelEvent = {
  event: string;
  distinctId: string;
  timestamp: DateLike;
  properties?: {
    entry_point?: string | null;
    journey_state?: JourneyStateAnalytics | null;
  };
};

type SegmentKey = {
  entryPoint: string;
  journeyState: string;
};

export type FunnelSegmentBreakdown = SegmentKey & {
  users: number;
};

export type FunnelStageReport = {
  milestone: CanonicalFunnelMilestone;
  users: number;
  conversionFromPrevious: number | null;
  dropoffFromPrevious: number | null;
  segmentBreakdown: FunnelSegmentBreakdown[];
};

export type WeeklyFunnelReport = {
  weekStartDate: string;
  weekEndDate: string;
  generatedAt: string;
  totalUsers: number;
  stages: FunnelStageReport[];
};

export type WeeklyFunnelReportOptions = {
  weekStartDate?: string;
  now?: Date;
};

type CanonicalMilestoneEvent = {
  event: CanonicalFunnelMilestone;
  distinctId: string;
  timestamp: Date;
  segment: SegmentKey;
};

function currentWeekStartDate(reference = new Date()): string {
  const utc = new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate()
    )
  );
  const day = utc.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - daysFromMonday);
  return utc.toISOString().slice(0, 10);
}

function parseIsoDateAtUtcStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toDate(value: DateLike): Date | null {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isCanonicalMilestone(
  value: string
): value is CanonicalFunnelMilestone {
  return (CANONICAL_FUNNEL_MILESTONES as readonly string[]).includes(value);
}

function normalizeSegment(properties: FunnelEvent["properties"]): SegmentKey {
  return {
    entryPoint:
      typeof properties?.entry_point === "string" &&
      properties.entry_point.trim().length > 0
        ? properties.entry_point.trim()
        : "unknown",
    journeyState:
      typeof properties?.journey_state === "string" &&
      properties.journey_state.trim().length > 0
        ? properties.journey_state.trim()
        : "unknown",
  };
}

function compareByTimestamp(a: { timestamp: Date }, b: { timestamp: Date }) {
  return a.timestamp.getTime() - b.timestamp.getTime();
}

function segmentSort(a: SegmentKey, b: SegmentKey): number {
  if (a.entryPoint === b.entryPoint) {
    return a.journeyState.localeCompare(b.journeyState);
  }
  return a.entryPoint.localeCompare(b.entryPoint);
}

function buildStageEventIndex(events: CanonicalMilestoneEvent[]) {
  const byStage = new Map<
    CanonicalFunnelMilestone,
    Map<string, CanonicalMilestoneEvent>
  >();

  for (const milestone of CANONICAL_FUNNEL_MILESTONES) {
    byStage.set(milestone, new Map());
  }

  for (const event of [...events].sort(compareByTimestamp)) {
    const stageEvents = byStage.get(event.event);
    if (!stageEvents || stageEvents.has(event.distinctId)) {
      continue;
    }
    stageEvents.set(event.distinctId, event);
  }

  return byStage;
}

function toPercentage(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 10_000) / 100;
}

function buildSegmentBreakdown(
  stageEvents: Map<string, CanonicalMilestoneEvent>
): FunnelSegmentBreakdown[] {
  const counts = new Map<string, FunnelSegmentBreakdown>();

  for (const event of stageEvents.values()) {
    const key = `${event.segment.entryPoint}::${event.segment.journeyState}`;
    const current = counts.get(key);
    if (current) {
      current.users += 1;
      continue;
    }

    counts.set(key, {
      entryPoint: event.segment.entryPoint,
      journeyState: event.segment.journeyState,
      users: 1,
    });
  }

  return [...counts.values()].sort((left, right) =>
    segmentSort(
      { entryPoint: left.entryPoint, journeyState: left.journeyState },
      { entryPoint: right.entryPoint, journeyState: right.journeyState }
    )
  );
}

function resolveWeekStartDate(options: WeeklyFunnelReportOptions): string {
  if (options.weekStartDate) {
    return options.weekStartDate;
  }
  return currentWeekStartDate(options.now);
}

function normalizeWeeklyEvents(
  events: FunnelEvent[],
  weekStart: Date,
  weekEnd: Date
): CanonicalMilestoneEvent[] {
  const normalized: CanonicalMilestoneEvent[] = [];

  for (const event of events) {
    if (!isCanonicalMilestone(event.event)) {
      continue;
    }

    const distinctId = event.distinctId.trim();
    if (distinctId.length === 0) {
      continue;
    }

    const timestamp = toDate(event.timestamp);
    if (!timestamp) {
      continue;
    }

    if (timestamp < weekStart || timestamp >= weekEnd) {
      continue;
    }

    normalized.push({
      event: event.event,
      distinctId,
      timestamp,
      segment: normalizeSegment(event.properties),
    });
  }

  return normalized;
}

export function buildWeeklyFunnelReport(
  events: FunnelEvent[],
  options: WeeklyFunnelReportOptions = {}
): WeeklyFunnelReport {
  const weekStartDate = resolveWeekStartDate(options);
  const weekStart = parseIsoDateAtUtcStart(weekStartDate);
  const weekEnd = addDays(weekStart, 7);
  const normalizedEvents = normalizeWeeklyEvents(events, weekStart, weekEnd);
  const stageIndex = buildStageEventIndex(normalizedEvents);
  const totalUsers = new Set(normalizedEvents.map((event) => event.distinctId))
    .size;

  const stages: FunnelStageReport[] = [];
  let previousUsers = 0;

  for (const milestone of CANONICAL_FUNNEL_MILESTONES) {
    const stageEvents = stageIndex.get(milestone) ?? new Map();
    const users = stageEvents.size;
    const conversionFromPrevious =
      stages.length === 0 ? null : toPercentage(users, previousUsers);
    const dropoffFromPrevious =
      conversionFromPrevious === null
        ? null
        : Math.round((100 - conversionFromPrevious) * 100) / 100;

    stages.push({
      milestone,
      users,
      conversionFromPrevious,
      dropoffFromPrevious,
      segmentBreakdown: buildSegmentBreakdown(stageEvents),
    });

    previousUsers = users;
  }

  return {
    weekStartDate,
    weekEndDate: weekEnd.toISOString().slice(0, 10),
    generatedAt: (options.now ?? new Date()).toISOString(),
    totalUsers,
    stages,
  };
}

export type FunnelInsightDefinition = {
  name: string;
  description: string;
  milestones: CanonicalFunnelMilestone[];
  breakdownProperties: ["entry_point", "journey_state"];
};

export function buildCanonicalFunnelInsightDefinition(): FunnelInsightDefinition {
  return {
    name: "portal_weekly_funnel_by_entry_and_state",
    description:
      "Weekly student portal funnel segmented by entry_point and journey_state.",
    milestones: [...CANONICAL_FUNNEL_MILESTONES],
    breakdownProperties: ["entry_point", "journey_state"],
  };
}
