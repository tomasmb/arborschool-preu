import { markLessonViewed } from "@/lib/student/atomMasteryEngine";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const { sessionId } = await params;
  try {
    await markLessonViewed(sessionId, userId);
    return studentApiSuccess({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark lesson viewed";
    return studentApiError("LESSON_VIEW_FAILED", message, 400);
  }
}
