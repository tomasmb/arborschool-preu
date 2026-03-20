import { getStudentNextAction } from "@/lib/student/nextAction";
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
    const nextActionData = await getStudentNextAction(userId);
    return studentApiSuccess(nextActionData, {
      headers: PRIVATE_CACHE_HEADERS,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load next action";
    return studentApiError("NEXT_ACTION_LOAD_FAILED", message, 500);
  }
}
