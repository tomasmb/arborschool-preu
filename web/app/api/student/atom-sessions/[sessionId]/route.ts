import { getSessionState } from "@/lib/student/atomMasteryEngine";
import {
  isValidUuid,
  studentApiError,
  studentApiSuccess,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const { sessionId } = await params;
  if (!isValidUuid(sessionId)) {
    return studentApiError("INVALID_ID", "Invalid session ID format", 400);
  }

  try {
    const result = await getSessionState(sessionId, userId);
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch session";
    return studentApiError("SESSION_FETCH_FAILED", message, 500);
  }
}
