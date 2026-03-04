import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  sendConfirmationEmail,
  scheduleFollowupEmail,
  isEmailConfigured,
} from "@/lib/email";
import type { ProfilingData, ResultsSnapshot } from "./types";

const FOLLOWUP_DEDUP_WINDOW_MS = 23 * 60 * 60 * 1000;
const FOLLOWUP_DELAY_MS = 24 * 60 * 60 * 1000;

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

async function wasFollowupScheduledRecently(userId: string): Promise<boolean> {
  const [userRecord] = await db
    .select({ followupEmailScheduledAt: users.followupEmailScheduledAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const lastScheduled = userRecord?.followupEmailScheduledAt;
  if (!lastScheduled) {
    return false;
  }

  return (
    Date.now() - new Date(lastScheduled).getTime() < FOLLOWUP_DEDUP_WINDOW_MS
  );
}

async function scheduleFollowupEmailSafely(params: {
  userId: string;
  userEmail: string;
  resultsSnapshot: ResultsSnapshot;
  profilingData?: ProfilingData;
}) {
  try {
    if (await wasFollowupScheduledRecently(params.userId)) {
      console.log(
        `[Profile] Skipping follow-up for ${params.userEmail} — already scheduled recently`
      );
      return;
    }

    const scheduledAt = new Date(Date.now() + FOLLOWUP_DELAY_MS).toISOString();
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
      console.warn(
        `[Profile] Failed to schedule follow-up: ${followupResult.error}`
      );
      return;
    }

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
  });
}
