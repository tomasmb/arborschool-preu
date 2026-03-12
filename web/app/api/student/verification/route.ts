import {
  createVerificationSession,
  submitVerificationAnswer,
} from "@/lib/student/verificationQuiz";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

/**
 * POST /api/student/verification
 * Creates a verification session with 1 hard question per
 * needs_verification atom. Returns all items at once.
 */
export async function POST() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const session = await createVerificationSession(userId);
    if (!session) {
      return studentApiSuccess({
        session: null,
        message: "No verification needed",
      });
    }
    return studentApiSuccess(session);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create verification session";
    return studentApiError("VERIFICATION_SESSION_FAILED", message, 400);
  }
}

type AnswerBody = {
  sessionId?: string;
  responseId?: string;
  selectedAnswer?: string;
};

/**
 * PUT /api/student/verification
 * Submit a verification answer. Each answer immediately resolves
 * the atom (restore mastered or downgrade to in_progress).
 */
export async function PUT(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: AnswerBody;
  try {
    body = (await request.json()) as AnswerBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!body.sessionId || !body.responseId || !body.selectedAnswer) {
    return studentApiError(
      "MISSING_FIELDS",
      "sessionId, responseId, and selectedAnswer are required",
      400
    );
  }

  try {
    const result = await submitVerificationAnswer({
      sessionId: body.sessionId,
      responseId: body.responseId,
      selectedAnswer: body.selectedAnswer,
      userId,
    });
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit verification answer";
    return studentApiError("VERIFICATION_ANSWER_FAILED", message, 400);
  }
}
