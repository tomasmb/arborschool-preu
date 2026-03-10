import { completeStudySprint } from "@/lib/student/studySprints";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const { sprintId } = await params;

  try {
    const result = await completeStudySprint(userId, sprintId);
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to complete sprint";
    return studentApiError("SPRINT_COMPLETE_FAILED", message, 400);
  }
}
