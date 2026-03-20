import {
  createReviewSession,
  submitReviewAnswer,
  completeReviewSession,
  handleReviewFailures,
} from "@/lib/student/spacedRepetition";
import {
  studentApiError,
  studentApiSuccess,
  isValidUuid,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";
import { getUserAccessStatus } from "@/lib/student/accessControl";
import { hasVerificationDue } from "@/lib/student/verificationQuiz";
import { getAuthenticatedUserById } from "@/lib/auth/users";

/**
 * POST /api/student/atom-sessions/review
 * Creates a review session with one hard question per due atom.
 * Returns the full session payload (all questions at once).
 */
export async function POST() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  // React.cache'd — free on second call within the same request
  const user = await getAuthenticatedUserById(userId);

  const [verificationBlocking, access] = await Promise.all([
    hasVerificationDue(userId),
    getUserAccessStatus(userId, user ?? undefined),
  ]);

  if (verificationBlocking) {
    return studentApiError(
      "VERIFICATION_REQUIRED",
      "Tienes conceptos pendientes de verificación. Completa la verificación antes de continuar con la revisión.",
      403
    );
  }

  if (access.subscriptionStatus !== "active") {
    return studentApiError(
      "ACCESS_REQUIRED",
      "La revisión espaciada requiere acceso completo.",
      403
    );
  }

  try {
    const session = await createReviewSession(userId);
    if (!session) {
      return studentApiSuccess({ session: null, message: "No reviews due" });
    }
    return studentApiSuccess(session);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create review session";
    return studentApiError("REVIEW_SESSION_FAILED", message, 400);
  }
}

type AnswerBody = {
  sessionId?: string;
  responseId?: string;
  selectedAnswer?: string;
};

type CompleteBody = {
  sessionId?: string;
};

/**
 * PUT /api/student/atom-sessions/review
 * Submit a review answer or complete the review session.
 * action: "answer" | "complete"
 */
export async function PUT(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: { action?: string } & AnswerBody & CompleteBody;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (body.action === "answer") {
    if (!body.sessionId || !body.responseId || !body.selectedAnswer) {
      return studentApiError(
        "MISSING_FIELDS",
        "sessionId, responseId, and selectedAnswer are required",
        400
      );
    }
    if (!isValidUuid(body.sessionId) || !isValidUuid(body.responseId)) {
      return studentApiError("INVALID_ID", "Invalid UUID format", 400);
    }
    try {
      const result = await submitReviewAnswer({
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
          : "Failed to submit review answer";
      return studentApiError("REVIEW_ANSWER_FAILED", message, 400);
    }
  }

  if (body.action === "complete") {
    if (!body.sessionId) {
      return studentApiError("MISSING_FIELDS", "sessionId is required", 400);
    }
    if (!isValidUuid(body.sessionId)) {
      return studentApiError("INVALID_ID", "Invalid UUID format", 400);
    }
    try {
      const completion = await completeReviewSession(body.sessionId, userId);
      let failureResult = null;
      if (completion.failedAtomIds.length > 0) {
        failureResult = await handleReviewFailures(
          userId,
          completion.failedAtomIds
        );
      }
      return studentApiSuccess({ ...completion, failureResult });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to complete review session";
      return studentApiError("REVIEW_COMPLETE_FAILED", message, 400);
    }
  }

  return studentApiError(
    "INVALID_BODY",
    "action must be 'answer' or 'complete'",
    400
  );
}
