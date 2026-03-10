import { createStudySprintForUser } from "@/lib/student/studySprints";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

type CreateSprintBody = {
  itemCount?: number;
};

export async function POST(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: CreateSprintBody = {};
  try {
    body = (await request.json()) as CreateSprintBody;
  } catch {
    // Empty body is valid.
  }

  const itemCount =
    body.itemCount !== undefined
      ? Math.max(1, Math.min(10, Math.floor(body.itemCount)))
      : 5;

  try {
    const sprint = await createStudySprintForUser(userId, itemCount);
    return studentApiSuccess(sprint);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create study sprint";
    return studentApiError("SPRINT_CREATE_FAILED", message, 400);
  }
}
