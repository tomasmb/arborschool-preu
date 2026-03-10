import { getStudentNextAction } from "@/lib/student/nextAction";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const nextActionData = await getStudentNextAction(userId);

    return studentApiSuccess({
      ...nextActionData,
      sprintHint: {
        ctaHref: "/portal/study",
        suggestedItemCount: 5,
        estimatedMinutes: nextActionData.nextAction?.studyMinutes ?? 25,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load next action";
    return studentApiError("NEXT_ACTION_LOAD_FAILED", message, 500);
  }
}
