import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { studentReminderJobs, users } from "@/db/schema";
import {
  scheduleFollowupEmail,
  type FollowupContext,
  type ResultsSnapshot,
} from "@/lib/email";
import {
  ACTIVATION_READY_FOLLOWUP_JOB_TYPE,
  claimLifecycleReminderJob,
  evaluateActivationReadyFollowupPolicy,
  updateLifecycleReminderJob,
} from "./lifecycleEmailPolicy";

const DEFAULT_DISPATCH_LIMIT = 50;
const MAX_DISPATCH_LIMIT = 200;

const DISPATCHABLE_STATUSES = ["pending"] as const;

type ActivationReadyFollowupPayload = {
  kind: "activation_ready_followup";
  resultsSnapshot: ResultsSnapshot;
  context: FollowupContext;
};

type ReminderJobRow = {
  id: string;
  userId: string;
  jobType: string;
  payload: Record<string, unknown> | null;
};

export type LifecycleReminderDispatchResult = {
  scanned: number;
  claimed: number;
  sent: number;
  skipped: number;
  failed: number;
};

type DispatchDependencies = {
  sendFollowupEmail: typeof scheduleFollowupEmail;
  now: Date;
  limit: number;
};

export type LifecycleReminderDispatchParams = {
  now?: Date;
  limit?: number;
  sendFollowupEmail?: typeof scheduleFollowupEmail;
};

function resolveLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_DISPATCH_LIMIT;
  }

  const parsed = Math.trunc(limit);
  if (parsed <= 0) {
    return DEFAULT_DISPATCH_LIMIT;
  }

  return Math.min(parsed, MAX_DISPATCH_LIMIT);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseTopRoute(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  const name = toOptionalString(value.name) ?? "";
  const questionsUnlocked = toFiniteNumber(value.questionsUnlocked) ?? 0;
  const pointsGain = toFiniteNumber(value.pointsGain) ?? 0;

  if (name.length === 0 || questionsUnlocked <= 0 || pointsGain <= 0) {
    return undefined;
  }

  return {
    name,
    questionsUnlocked,
    pointsGain,
  };
}

function parseResultsSnapshot(value: unknown): ResultsSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const paesMin = toFiniteNumber(value.paesMin);
  const paesMax = toFiniteNumber(value.paesMax);
  const performanceTier = toOptionalString(value.performanceTier);

  if (paesMin === null || paesMax === null || performanceTier === null) {
    return null;
  }

  const topRoute = parseTopRoute(value.topRoute);
  return {
    paesMin,
    paesMax,
    performanceTier,
    ...(topRoute ? { topRoute } : {}),
  };
}

function parseFollowupContext(value: unknown): FollowupContext {
  if (!isRecord(value)) {
    return {
      paesGoal: null,
      paesDate: null,
    };
  }

  return {
    paesGoal: toOptionalString(value.paesGoal),
    paesDate: toOptionalString(value.paesDate),
  };
}

function parseFollowupPayload(
  payload: Record<string, unknown> | null
): ActivationReadyFollowupPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (payload.kind !== "activation_ready_followup") {
    return null;
  }

  const resultsSnapshot = parseResultsSnapshot(payload.resultsSnapshot);
  if (!resultsSnapshot) {
    return null;
  }

  return {
    kind: "activation_ready_followup",
    resultsSnapshot,
    context: parseFollowupContext(payload.context),
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown dispatch error";
}

async function loadReminderCandidates(
  now: Date,
  limit: number
): Promise<ReminderJobRow[]> {
  return db
    .select({
      id: studentReminderJobs.id,
      userId: studentReminderJobs.userId,
      jobType: studentReminderJobs.jobType,
      payload: studentReminderJobs.payload,
    })
    .from(studentReminderJobs)
    .where(
      and(
        eq(studentReminderJobs.channel, "email"),
        inArray(studentReminderJobs.status, [
          ...DISPATCHABLE_STATUSES,
        ] as string[]),
        lte(studentReminderJobs.scheduledFor, now)
      )
    )
    .orderBy(asc(studentReminderJobs.scheduledFor))
    .limit(limit);
}

async function markUnsupportedJob(jobId: string, jobType: string) {
  await updateLifecycleReminderJob({
    jobId,
    status: "failed",
    lastError: `unsupported_job_type:${jobType}`,
  });
}

async function markSuppressedJob(jobId: string, reason: string) {
  await updateLifecycleReminderJob({
    jobId,
    status: "skipped",
    lastError: `suppressed:${reason}`,
  });
}

export function buildActivationReadyFollowupPayload(params: {
  resultsSnapshot: ResultsSnapshot;
  context?: FollowupContext;
}): Record<string, unknown> {
  return {
    kind: "activation_ready_followup",
    resultsSnapshot: params.resultsSnapshot,
    context: {
      paesGoal: params.context?.paesGoal ?? null,
      paesDate: params.context?.paesDate ?? null,
    },
  };
}

async function dispatchActivationReadyFollowup(params: {
  job: ReminderJobRow;
  dependencies: DispatchDependencies;
}) {
  const { job, dependencies } = params;
  const policy = await evaluateActivationReadyFollowupPolicy(job.userId, {
    excludeJobId: job.id,
    enforceCaps: false,
  });
  if (!policy.allowed) {
    await markSuppressedJob(job.id, policy.reason);
    return "skipped" as const;
  }

  const payload = parseFollowupPayload(job.payload);
  if (!payload) {
    await updateLifecycleReminderJob({
      jobId: job.id,
      status: "failed",
      lastError: "invalid_payload",
    });
    return "failed" as const;
  }

  const [recipient] = await db
    .select({
      email: users.email,
      firstName: users.firstName,
    })
    .from(users)
    .where(eq(users.id, job.userId))
    .limit(1);

  if (!recipient) {
    await updateLifecycleReminderJob({
      jobId: job.id,
      status: "failed",
      lastError: "user_not_found",
    });
    return "failed" as const;
  }

  const sendResult = await dependencies.sendFollowupEmail({
    recipient: {
      email: recipient.email,
      firstName: recipient.firstName ?? undefined,
      userId: job.userId,
    },
    results: payload.resultsSnapshot,
    context: payload.context,
  });

  if (!sendResult.success) {
    await updateLifecycleReminderJob({
      jobId: job.id,
      status: "failed",
      lastError: sendResult.error ?? "send_failed",
    });
    return "failed" as const;
  }

  await updateLifecycleReminderJob({
    jobId: job.id,
    status: "sent",
    sentAt: dependencies.now,
  });
  return "sent" as const;
}

export async function dispatchDueLifecycleReminderJobs(
  params: LifecycleReminderDispatchParams = {}
): Promise<LifecycleReminderDispatchResult> {
  const dependencies: DispatchDependencies = {
    sendFollowupEmail: params.sendFollowupEmail ?? scheduleFollowupEmail,
    now: params.now ?? new Date(),
    limit: resolveLimit(params.limit),
  };

  const jobs = await loadReminderCandidates(
    dependencies.now,
    dependencies.limit
  );
  const summary: LifecycleReminderDispatchResult = {
    scanned: jobs.length,
    claimed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const job of jobs) {
    const claimed = await claimLifecycleReminderJob(job.id);
    if (!claimed) {
      continue;
    }

    summary.claimed += 1;

    try {
      if (job.jobType !== ACTIVATION_READY_FOLLOWUP_JOB_TYPE) {
        await markUnsupportedJob(job.id, job.jobType);
        summary.failed += 1;
        continue;
      }

      const result = await dispatchActivationReadyFollowup({
        job,
        dependencies,
      });

      if (result === "sent") {
        summary.sent += 1;
      } else if (result === "skipped") {
        summary.skipped += 1;
      } else {
        summary.failed += 1;
      }
    } catch (error) {
      await updateLifecycleReminderJob({
        jobId: job.id,
        status: "failed",
        lastError: toErrorMessage(error),
      });
      summary.failed += 1;
    }
  }

  return summary;
}
