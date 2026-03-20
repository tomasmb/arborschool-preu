import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentPlanningProfiles } from "@/db/schema";
import {
  PRIVATE_CACHE_HEADERS,
  studentApiError,
  studentApiSuccess,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const [row] = await db
      .select({
        reminderInApp: studentPlanningProfiles.reminderInApp,
        reminderEmail: studentPlanningProfiles.reminderEmail,
      })
      .from(studentPlanningProfiles)
      .where(eq(studentPlanningProfiles.userId, userId))
      .limit(1);

    return studentApiSuccess(
      {
        reminderInApp: row?.reminderInApp ?? true,
        reminderEmail: row?.reminderEmail ?? true,
      },
      { headers: PRIVATE_CACHE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load reminder preferences";
    return studentApiError("REMINDER_PREFERENCES_LOAD_FAILED", message, 500);
  }
}

type ReminderPreferencesBody = {
  reminderInApp?: boolean;
  reminderEmail?: boolean;
};

export async function POST(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: ReminderPreferencesBody;
  try {
    body = (await request.json()) as ReminderPreferencesBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (body.reminderInApp === undefined && body.reminderEmail === undefined) {
    return studentApiError(
      "MISSING_FIELDS",
      "At least one reminder preference is required",
      400
    );
  }

  try {
    const now = new Date();
    const [updated] = await db
      .insert(studentPlanningProfiles)
      .values({
        userId,
        weeklyMinutesTarget: 360,
        timezone: "America/Santiago",
        reminderInApp: body.reminderInApp ?? true,
        reminderEmail: body.reminderEmail ?? true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: studentPlanningProfiles.userId,
        set: {
          ...(body.reminderInApp !== undefined && {
            reminderInApp: body.reminderInApp,
          }),
          ...(body.reminderEmail !== undefined && {
            reminderEmail: body.reminderEmail,
          }),
          updatedAt: now,
        },
      })
      .returning({
        reminderInApp: studentPlanningProfiles.reminderInApp,
        reminderEmail: studentPlanningProfiles.reminderEmail,
        updatedAt: studentPlanningProfiles.updatedAt,
      });

    return studentApiSuccess(updated);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update reminder preferences";
    return studentApiError("REMINDER_PREFERENCES_SAVE_FAILED", message, 500);
  }
}
