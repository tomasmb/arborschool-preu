import { getStudySprint } from "@/lib/student/studySprints";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const { sprintId } = await params;
  try {
    const sprint = await getStudySprint(userId, sprintId);

    if (!sprint) {
      return studentApiError("NOT_FOUND", "Study sprint not found", 404);
    }

    return studentApiSuccess(sprint);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sprint";
    return studentApiError("SPRINT_FETCH_FAILED", message, 500);
  }
}
