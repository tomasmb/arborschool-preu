import { submitStudySprintAnswer } from "@/lib/student/studySprints";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

type AnswerBody = {
  sprintItemId?: string;
  selectedAnswer?: string;
  responseTimeSeconds?: number;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const { sprintId } = await params;

  let body: AnswerBody;
  try {
    body = (await request.json()) as AnswerBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!body.sprintItemId || !body.selectedAnswer) {
    return studentApiError(
      "MISSING_FIELDS",
      "sprintItemId and selectedAnswer are required",
      400
    );
  }

  try {
    const result = await submitStudySprintAnswer({
      userId,
      sprintId,
      sprintItemId: body.sprintItemId,
      selectedAnswer: body.selectedAnswer,
      responseTimeSeconds: body.responseTimeSeconds,
    });

    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit sprint answer";
    return studentApiError("SPRINT_ANSWER_FAILED", message, 400);
  }
}
