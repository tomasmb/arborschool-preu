import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  studentPlanningProfiles,
  studentReminderJobs,
  studentStudySprints,
  users,
} from "@/db/schema";
import type { ScheduleFollowupParams } from "@/lib/email";
import {
  ACTIVATION_READY_FOLLOWUP_JOB_TYPE,
  buildActivationReadyFollowupDedupeKey,
  createLifecycleReminderJob,
} from "@/lib/student/lifecycleEmailPolicy";
import {
  buildActivationReadyFollowupPayload,
  dispatchDueLifecycleReminderJobs,
} from "@/lib/student/lifecycleReminderDispatch";

type CreatedUser = {
  id: string;
  email: string;
};

type JobSnapshot = {
  status: string;
  lastError: string | null;
  sentAt: Date | null;
};

type DispatchCall = {
  userId: string;
  email: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function createTempUser(): Promise<CreatedUser> {
  const email = `portal-reminder-check-${Date.now()}-${Math.random().toString(16).slice(2)}@arbor.local`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      role: "student",
      paesScoreMin: 630,
      paesScoreMax: 710,
    })
    .returning({ id: users.id, email: users.email });

  assert(user, "Failed to create temp user");
  return user;
}

async function cleanupUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

async function seedPlanningProfile(params: {
  userId: string;
  reminderEmail: boolean;
}) {
  await db.insert(studentPlanningProfiles).values({
    userId: params.userId,
    weeklyMinutesTarget: 360,
    timezone: "America/Santiago",
    reminderEmail: params.reminderEmail,
    reminderInApp: true,
  });
}

async function createDueFollowupJob(params: {
  userId: string;
  attemptId: string;
  dedupeSuffix: string;
}): Promise<string> {
  const dedupeKey = buildActivationReadyFollowupDedupeKey(
    params.userId,
    `${params.attemptId}-${params.dedupeSuffix}`
  );

  const created = await createLifecycleReminderJob({
    userId: params.userId,
    jobType: ACTIVATION_READY_FOLLOWUP_JOB_TYPE,
    dedupeKey,
    scheduledFor: new Date(Date.now() - 60_000),
    payload: buildActivationReadyFollowupPayload({
      resultsSnapshot: {
        paesMin: 630,
        paesMax: 710,
        performanceTier: "high",
        topRoute: {
          name: "Numeros y Algebra",
          questionsUnlocked: 12,
          pointsGain: 35,
        },
      },
      context: {
        paesGoal: "800+",
        paesDate: "2026-11",
      },
    }),
  });

  assert(created.created && created.jobId, "Failed to create reminder job");
  return created.jobId;
}

async function markUserAsActiveLearning(userId: string) {
  await db.insert(studentStudySprints).values({
    userId,
    status: "completed",
    completedAt: new Date(),
  });
}

async function getJobSnapshot(jobId: string): Promise<JobSnapshot> {
  const [job] = await db
    .select({
      status: studentReminderJobs.status,
      lastError: studentReminderJobs.lastError,
      sentAt: studentReminderJobs.sentAt,
    })
    .from(studentReminderJobs)
    .where(eq(studentReminderJobs.id, jobId))
    .limit(1);

  assert(job, `Missing reminder job ${jobId}`);
  return job;
}

async function main() {
  const createdUsers: string[] = [];
  const dispatchCalls: DispatchCall[] = [];

  const fakeSendFollowupEmail = async (params: ScheduleFollowupParams) => {
    dispatchCalls.push({
      userId: params.recipient.userId,
      email: params.recipient.email,
    });
    return {
      success: true,
      messageId: `fake-followup-${dispatchCalls.length}`,
    };
  };

  try {
    const allowedUser = await createTempUser();
    createdUsers.push(allowedUser.id);
    await seedPlanningProfile({ userId: allowedUser.id, reminderEmail: true });
    const allowedJobId = await createDueFollowupJob({
      userId: allowedUser.id,
      attemptId: "attempt-allowed",
      dedupeSuffix: "allowed",
    });

    const staleUser = await createTempUser();
    createdUsers.push(staleUser.id);
    await seedPlanningProfile({ userId: staleUser.id, reminderEmail: true });
    const staleJobId = await createDueFollowupJob({
      userId: staleUser.id,
      attemptId: "attempt-stale",
      dedupeSuffix: "stale",
    });
    await markUserAsActiveLearning(staleUser.id);

    const mutedUser = await createTempUser();
    createdUsers.push(mutedUser.id);
    await seedPlanningProfile({ userId: mutedUser.id, reminderEmail: false });
    const mutedJobId = await createDueFollowupJob({
      userId: mutedUser.id,
      attemptId: "attempt-muted",
      dedupeSuffix: "muted",
    });

    const dispatchSummary = await dispatchDueLifecycleReminderJobs({
      limit: 20,
      sendFollowupEmail: fakeSendFollowupEmail,
    });

    const allowedJob = await getJobSnapshot(allowedJobId);
    const staleJob = await getJobSnapshot(staleJobId);
    const mutedJob = await getJobSnapshot(mutedJobId);

    assert(
      dispatchSummary.scanned >= 3 && dispatchSummary.claimed >= 3,
      "Expected dispatcher to claim all scenario jobs"
    );
    assert(allowedJob.status === "sent", "Expected allowed job to be sent");
    assert(allowedJob.sentAt !== null, "Expected allowed job sentAt timestamp");

    assert(staleJob.status === "skipped", "Expected stale job to be skipped");
    assert(
      staleJob.lastError === "suppressed:journey_not_activation_ready",
      `Unexpected stale-job reason: ${staleJob.lastError}`
    );

    assert(mutedJob.status === "skipped", "Expected muted job to be skipped");
    assert(
      mutedJob.lastError === "suppressed:reminder_email_disabled",
      `Unexpected muted-job reason: ${mutedJob.lastError}`
    );

    assert(
      dispatchCalls.length === 1 && dispatchCalls[0]?.userId === allowedUser.id,
      "Expected exactly one follow-up send call"
    );

    console.log(
      JSON.stringify(
        {
          status: "ok",
          checks: {
            sendAllowedJob: "pass",
            suppressStaleJourneyJob: "pass",
            suppressDisabledReminderJob: "pass",
          },
          dispatchSummary,
          sentRecipients: dispatchCalls,
        },
        null,
        2
      )
    );
  } finally {
    for (const userId of createdUsers) {
      await cleanupUser(userId);
    }
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[verifyLifecycleReminderDispatch] failed", error);
    process.exit(1);
  });
