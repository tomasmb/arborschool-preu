import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";
import { updatePrimaryGoalScore } from "@/lib/student/goals.write";

type PatchBody = {
  testCode?: string;
  score?: number;
};

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!body.testCode || typeof body.testCode !== "string") {
    return studentApiError("MISSING_FIELDS", "testCode is required", 400);
  }

  if (
    body.score == null ||
    typeof body.score !== "number" ||
    body.score < 100 ||
    body.score > 1000
  ) {
    return studentApiError(
      "MISSING_FIELDS",
      "score must be a number between 100 and 1000",
      400
    );
  }

  try {
    const result = await updatePrimaryGoalScore(
      userId,
      body.testCode,
      body.score
    );
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update score";
    return studentApiError("GOALS_SAVE_FAILED", message, 400);
  }
}
