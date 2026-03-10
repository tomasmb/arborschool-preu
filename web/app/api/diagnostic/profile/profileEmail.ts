import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendConfirmationEmail, isEmailConfigured } from "@/lib/email";
import {
  ACTIVATION_READY_FOLLOWUP_JOB_TYPE,
  buildActivationReadyFollowupDedupeKey,
  createLifecycleReminderJob,
  evaluateActivationReadyConfirmationPolicy,
  evaluateActivationReadyFollowupPolicy,
  resolveActivationReadyFollowupSchedule,
} from "@/lib/student/lifecycleEmailPolicy";
import { buildActivationReadyFollowupPayload } from "@/lib/student/lifecycleReminderDispatch";
import type { ProfilingData, ResultsSnapshot } from "./types";

function toEmailResultsSnapshot(resultsSnapshot: ResultsSnapshot) {
  return {
    paesMin: resultsSnapshot.paesMin,
    paesMax: resultsSnapshot.paesMax,
    performanceTier: resultsSnapshot.performanceTier ?? "average",
    topRoute: resultsSnapshot.topRoute,
  };
}

function logLifecycleSkip(params: {
  userEmail: string;
  reason: string;
  message: "confirmation email" | "follow-up";
}) {
  console.log(
    `[Profile] Skipping ${params.message} for ${params.userEmail}: ${params.reason}`
  );
}

function logDeniedLifecyclePolicy(params: {
  userEmail: string;
  reason: string;
  message: "confirmation email" | "follow-up";
}) {
  logLifecycleSkip(params);
}

async function sendConfirmationEmailSafely(params: {
  userId: string;
  userEmail: string;
  resultsSnapshot: ResultsSnapshot;
}) {
  const policy = await evaluateActivationReadyConfirmationPolicy(params.userId);
  if (!policy.allowed)
    return logDeniedLifecyclePolicy({
      userEmail: params.userEmail,
      reason: policy.reason,
      message: "confirmation email",
    });

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
  if (!policy.allowed)
    return logDeniedLifecyclePolicy({
      userEmail: params.userEmail,
      reason: policy.reason,
      message: "follow-up",
    });

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
      payload: buildActivationReadyFollowupPayload({
        resultsSnapshot: toEmailResultsSnapshot(params.resultsSnapshot),
        context: {
          paesGoal: params.profilingData?.paesGoal,
          paesDate: params.profilingData?.paesDate,
        },
      }),
    });

    if (!reminderJob.created || !reminderJob.jobId) {
      console.log(
        `[Profile] Skipping follow-up for ${params.userEmail}: duplicate attempt/job`
      );
      return;
    }

    await db
      .update(users)
      .set({ followupEmailScheduledAt: new Date(scheduledAt) })
      .where(eq(users.id, params.userId));

    console.log(
      `[Profile] Follow-up reminder queued for ${params.userEmail} at ${scheduledAt}`
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
