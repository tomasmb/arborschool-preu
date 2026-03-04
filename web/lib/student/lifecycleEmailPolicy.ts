import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  studentPlanningProfiles,
  studentReminderJobs,
  users,
} from "@/db/schema";
import {
  getStudentJourneySnapshot,
  type StudentJourneyState,
} from "./journeyState";

const DAY_MS = 24 * 60 * 60 * 1000;
const LIFECYCLE_DAILY_CAP = 1;
const LIFECYCLE_WEEKLY_CAP = 3;
const FOLLOWUP_DELAY_MS = DAY_MS;
const DEFAULT_TIME_ZONE = "America/Santiago";
const SEND_WINDOW_START_HOUR = 9;
const SEND_WINDOW_END_HOUR = 21;

type LifecycleDecisionReason =
  | "allowed"
  | "unsubscribed"
  | "journey_not_activation_ready"
  | "reminder_email_disabled"
  | "daily_cap_reached"
  | "weekly_cap_reached";

type LifecycleJobStatus = "pending" | "scheduled" | "sent" | "failed";

const COUNTABLE_LIFECYCLE_STATUSES: LifecycleJobStatus[] = [
  "pending",
  "scheduled",
  "sent",
];

export const ACTIVATION_READY_FOLLOWUP_JOB_TYPE =
  "activation_ready_followup" as const;

const LIFECYCLE_JOB_TYPES = [ACTIVATION_READY_FOLLOWUP_JOB_TYPE] as const;

type LifecycleContext = {
  journeyState: StudentJourneyState;
  unsubscribed: boolean;
  reminderEmailEnabled: boolean;
  timeZone: string;
  lifecycleCountLastDay: number;
  lifecycleCountLastWeek: number;
};

export type LifecyclePolicyDecision = {
  allowed: boolean;
  reason: LifecycleDecisionReason;
  context: LifecycleContext;
};

type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function getNumberPart(
  parts: Intl.DateTimeFormatPart[],
  type: "year" | "month" | "day" | "hour" | "minute" | "second"
): number {
  const part = parts.find((value) => value.type === type);
  if (!part) {
    return 0;
  }

  return Number(part.value);
}

function getZonedDateTimeParts(
  value: Date,
  timeZone: string
): ZonedDateTimeParts {
  const parts = getFormatter(timeZone).formatToParts(value);
  return {
    year: getNumberPart(parts, "year"),
    month: getNumberPart(parts, "month"),
    day: getNumberPart(parts, "day"),
    hour: getNumberPart(parts, "hour"),
    minute: getNumberPart(parts, "minute"),
    second: getNumberPart(parts, "second"),
  };
}

function toComparableTimestamp(parts: ZonedDateTimeParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
}

function zonedLocalToUtc(value: ZonedDateTimeParts, timeZone: string): Date {
  let guess = new Date(
    Date.UTC(
      value.year,
      value.month - 1,
      value.day,
      value.hour,
      value.minute,
      value.second
    )
  );

  for (let index = 0; index < 6; index += 1) {
    const guessParts = getZonedDateTimeParts(guess, timeZone);
    const diff =
      toComparableTimestamp(value) - toComparableTimestamp(guessParts);

    if (diff === 0) {
      return guess;
    }

    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}

function addDaysLocal(
  value: ZonedDateTimeParts,
  days: number
): ZonedDateTimeParts {
  const shifted = new Date(
    Date.UTC(
      value.year,
      value.month - 1,
      value.day + days,
      value.hour,
      value.minute,
      value.second
    )
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function resolveTimeZone(value: string | null | undefined): string {
  if (value && isValidTimeZone(value)) {
    return value;
  }

  return DEFAULT_TIME_ZONE;
}

async function countLifecycleEmailsSince(
  userId: string,
  since: Date
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(studentReminderJobs)
    .where(
      and(
        eq(studentReminderJobs.userId, userId),
        eq(studentReminderJobs.channel, "email"),
        inArray(studentReminderJobs.jobType, [...LIFECYCLE_JOB_TYPES]),
        inArray(studentReminderJobs.status, [
          ...COUNTABLE_LIFECYCLE_STATUSES,
        ] as string[]),
        gte(studentReminderJobs.createdAt, since)
      )
    );

  return Number(row?.count ?? 0);
}

async function getLifecycleContext(userId: string): Promise<LifecycleContext> {
  const now = Date.now();

  const [
    journeySnapshot,
    userRow,
    planningRow,
    lifecycleCountLastDay,
    lifecycleCountLastWeek,
  ] = await Promise.all([
    getStudentJourneySnapshot(userId),
    db
      .select({ unsubscribed: users.unsubscribed })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        reminderEmail: studentPlanningProfiles.reminderEmail,
        timeZone: studentPlanningProfiles.timezone,
      })
      .from(studentPlanningProfiles)
      .where(eq(studentPlanningProfiles.userId, userId))
      .limit(1),
    countLifecycleEmailsSince(userId, new Date(now - DAY_MS)),
    countLifecycleEmailsSince(userId, new Date(now - 7 * DAY_MS)),
  ]);

  return {
    journeyState: journeySnapshot.journeyState,
    unsubscribed: Boolean(userRow[0]?.unsubscribed),
    reminderEmailEnabled: planningRow[0]?.reminderEmail ?? true,
    timeZone: resolveTimeZone(planningRow[0]?.timeZone),
    lifecycleCountLastDay,
    lifecycleCountLastWeek,
  };
}

function allow(context: LifecycleContext): LifecyclePolicyDecision {
  return {
    allowed: true,
    reason: "allowed",
    context,
  };
}

function deny(
  context: LifecycleContext,
  reason: Exclude<LifecycleDecisionReason, "allowed">
): LifecyclePolicyDecision {
  return {
    allowed: false,
    reason,
    context,
  };
}

export async function evaluateActivationReadyConfirmationPolicy(
  userId: string
): Promise<LifecyclePolicyDecision> {
  const context = await getLifecycleContext(userId);

  if (context.unsubscribed) {
    return deny(context, "unsubscribed");
  }

  if (context.journeyState !== "activation_ready") {
    return deny(context, "journey_not_activation_ready");
  }

  return allow(context);
}

export async function evaluateActivationReadyFollowupPolicy(
  userId: string
): Promise<LifecyclePolicyDecision> {
  const context = await getLifecycleContext(userId);

  if (context.unsubscribed) {
    return deny(context, "unsubscribed");
  }

  if (context.journeyState !== "activation_ready") {
    return deny(context, "journey_not_activation_ready");
  }

  if (!context.reminderEmailEnabled) {
    return deny(context, "reminder_email_disabled");
  }

  if (context.lifecycleCountLastDay >= LIFECYCLE_DAILY_CAP) {
    return deny(context, "daily_cap_reached");
  }

  if (context.lifecycleCountLastWeek >= LIFECYCLE_WEEKLY_CAP) {
    return deny(context, "weekly_cap_reached");
  }

  return allow(context);
}

export function resolveActivationReadyFollowupSchedule(params: {
  now?: Date;
  timeZone?: string | null;
}): string {
  const baseTime = params.now ? params.now.getTime() : Date.now();
  const base = new Date(baseTime + FOLLOWUP_DELAY_MS);
  const timeZone = resolveTimeZone(params.timeZone);

  const localBase = getZonedDateTimeParts(base, timeZone);
  if (
    localBase.hour >= SEND_WINDOW_START_HOUR &&
    localBase.hour < SEND_WINDOW_END_HOUR
  ) {
    return base.toISOString();
  }

  const windowStartBase =
    localBase.hour >= SEND_WINDOW_END_HOUR
      ? addDaysLocal(localBase, 1)
      : localBase;

  const localWindowStart: ZonedDateTimeParts = {
    ...windowStartBase,
    hour: SEND_WINDOW_START_HOUR,
    minute: 0,
    second: 0,
  };

  return zonedLocalToUtc(localWindowStart, timeZone).toISOString();
}

export function buildActivationReadyFollowupDedupeKey(
  userId: string,
  attemptId: string | null
): string {
  const safeAttempt =
    attemptId && attemptId.trim().length > 0 ? attemptId : "unknown_attempt";
  return `${ACTIVATION_READY_FOLLOWUP_JOB_TYPE}:${userId}:${safeAttempt}`;
}

export async function createLifecycleReminderJob(params: {
  userId: string;
  jobType: string;
  dedupeKey: string;
  scheduledFor: Date;
  payload?: Record<string, unknown>;
}): Promise<{ created: boolean; jobId: string | null }> {
  const inserted = await db
    .insert(studentReminderJobs)
    .values({
      userId: params.userId,
      channel: "email",
      jobType: params.jobType,
      status: "pending",
      dedupeKey: params.dedupeKey,
      scheduledFor: params.scheduledFor,
      payload: params.payload ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: studentReminderJobs.dedupeKey })
    .returning({ id: studentReminderJobs.id });

  return {
    created: inserted.length > 0,
    jobId: inserted[0]?.id ?? null,
  };
}

export async function updateLifecycleReminderJob(params: {
  jobId: string;
  status: LifecycleJobStatus;
  lastError?: string | null;
  sentAt?: Date | null;
}) {
  await db
    .update(studentReminderJobs)
    .set({
      status: params.status,
      lastError: params.lastError ?? null,
      sentAt: params.sentAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(studentReminderJobs.id, params.jobId));
}
