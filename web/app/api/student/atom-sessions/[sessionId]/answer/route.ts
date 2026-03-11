import { submitAnswer } from "@/lib/student/atomMasteryEngine";
import {
  isValidUuid,
  studentApiError,
  studentApiSuccess,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

type AnswerBody = {
  responseId?: string;
  selectedAnswer?: string;
  responseTimeSeconds?: number;
};

export async function POST(
  request: Request,
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

  let body: AnswerBody;
  try {
    body = (await request.json()) as AnswerBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!body.responseId || !body.selectedAnswer) {
    return studentApiError(
      "MISSING_FIELDS",
      "responseId and selectedAnswer are required",
      400
    );
  }

  try {
    const result = await submitAnswer({
      sessionId,
      responseId: body.responseId,
      selectedAnswer: body.selectedAnswer,
      userId,
      responseTimeSeconds: body.responseTimeSeconds,
    });
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit answer";
    return studentApiError("ANSWER_SUBMIT_FAILED", message, 400);
  }
}
