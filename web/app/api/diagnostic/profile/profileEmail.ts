import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  sendConfirmationEmail,
  scheduleFollowupEmail,
  isEmailConfigured,
} from "@/lib/email";
import {
  ACTIVATION_READY_FOLLOWUP_JOB_TYPE,
  buildActivationReadyFollowupDedupeKey,
  createLifecycleReminderJob,
  evaluateActivationReadyConfirmationPolicy,
  evaluateActivationReadyFollowupPolicy,
  resolveActivationReadyFollowupSchedule,
  updateLifecycleReminderJob,
} from "@/lib/student/lifecycleEmailPolicy";
import type { ProfilingData, ResultsSnapshot } from "./types";

function toEmailResultsSnapshot(resultsSnapshot: ResultsSnapshot) {
  return {
    paesMin: resultsSnapshot.paesMin,
    paesMax: resultsSnapshot.paesMax,
    performanceTier: resultsSnapshot.performanceTier ?? "average",
    topRoute: resultsSnapshot.topRoute,
  };
}

async function sendConfirmationEmailSafely(params: {
  userId: string;
  userEmail: string;
  resultsSnapshot: ResultsSnapshot;
}) {
  const policy = await evaluateActivationReadyConfirmationPolicy(params.userId);
  if (!policy.allowed) {
    console.log(
      `[Profile] Skipping confirmation email for ${params.userEmail}: ${policy.reason}`
    );
    return;
  }

  try {
    const emailResult = await sendConfirmationEmail(
      { email: params.userEmail, userId: params.userId, firstName: undefined },
      toEmailResultsSnapshot(params.resultsSnapshot)
    );

    if (emailResult.success) {
      console.log(`[Profile] Confirmation email sent to ${params.userEmail}`);
      return;
    }

    console.warn(`[Profile] Failed to send email: ${emailResult.error}`);
  } catch (error) {
    console.error("[Profile] Email exception:", error);
  }
}

async function scheduleFollowupEmailSafely(params: {
  userId: string;
  userEmail: string;
  resultsSnapshot: ResultsSnapshot;
  profilingData?: ProfilingData;
  attemptId: string | null;
}) {
  const policy = await evaluateActivationReadyFollowupPolicy(params.userId);
  if (!policy.allowed) {
    console.log(
      `[Profile] Skipping follow-up for ${params.userEmail}: ${policy.reason}`
    );
    return;
  }

  try {
    const scheduledAt = resolveActivationReadyFollowupSchedule({
      timeZone: policy.context.timeZone,
    });
    const dedupeKey = buildActivationReadyFollowupDedupeKey(
      params.userId,
      params.attemptId
    );

    const reminderJob = await createLifecycleReminderJob({
      userId: params.userId,
      jobType: ACTIVATION_READY_FOLLOWUP_JOB_TYPE,
      dedupeKey,
      scheduledFor: new Date(scheduledAt),
      payload: {
        kind: "activation_ready_followup",
        resultsSnapshot: toEmailResultsSnapshot(params.resultsSnapshot),
      },
    });

    if (!reminderJob.created || !reminderJob.jobId) {
      console.log(
        `[Profile] Skipping follow-up for ${params.userEmail}: duplicate attempt/job`
      );
      return;
    }

    const followupResult = await scheduleFollowupEmail({
      recipient: { email: params.userEmail, userId: params.userId },
      results: toEmailResultsSnapshot(params.resultsSnapshot),
      context: {
        paesGoal: params.profilingData?.paesGoal,
        paesDate: params.profilingData?.paesDate,
      },
      scheduledAt,
    });

    if (!followupResult.success) {
      await updateLifecycleReminderJob({
        jobId: reminderJob.jobId,
        status: "failed",
        lastError: followupResult.error ?? "Unknown scheduling error",
      });
      console.warn(
        `[Profile] Failed to schedule follow-up: ${followupResult.error}`
      );
      return;
    }

    await updateLifecycleReminderJob({
      jobId: reminderJob.jobId,
      status: "scheduled",
    });

    await db
      .update(users)
      .set({ followupEmailScheduledAt: new Date() })
      .where(eq(users.id, params.userId));

    console.log(
      `[Profile] Follow-up email scheduled for ${params.userEmail} at ${scheduledAt}`
    );
  } catch (error) {
    console.error("[Profile] Follow-up scheduling exception:", error);
  }
}

export async function processProfileEmails(params: {
  userId: string;
  userEmail: string;
  resultsSnapshot: ResultsSnapshot | null;
  profilingData?: ProfilingData;
  attemptId: string | null;
}) {
  if (!params.resultsSnapshot || !isEmailConfigured()) {
    return;
  }

  await sendConfirmationEmailSafely({
    userId: params.userId,
    userEmail: params.userEmail,
    resultsSnapshot: params.resultsSnapshot,
  });

  await scheduleFollowupEmailSafely({
    userId: params.userId,
    userEmail: params.userEmail,
    resultsSnapshot: params.resultsSnapshot,
    profilingData: params.profilingData,
    attemptId: params.attemptId,
  });
}
