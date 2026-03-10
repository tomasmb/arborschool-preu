import { getNextQuestion } from "@/lib/student/atomMasteryEngine";
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
    const result = await getNextQuestion(sessionId, userId);
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get next question";
    return studentApiError("NEXT_QUESTION_FAILED", message, 400);
  }
}
