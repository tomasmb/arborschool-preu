import {
  MAX_PRIMARY_GOALS,
  saveStudentGoalsView,
  type StudentPlanningProfileInput,
  type StudentGoalInput,
  getStudentGoalsView,
} from "@/lib/student/goals";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

type GoalsRequestBody = {
  goals?: StudentGoalInput[];
  planningProfile?: StudentPlanningProfileInput;
};

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const view = await getStudentGoalsView(userId);
  return studentApiSuccess(view);
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: GoalsRequestBody;
  try {
    body = (await request.json()) as GoalsRequestBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!body.goals || !Array.isArray(body.goals)) {
    return studentApiError("GOALS_REQUIRED", "goals array is required", 400);
  }

  if (
    body.goals.filter((goal) => goal.isPrimary !== false).length >
    MAX_PRIMARY_GOALS
  ) {
    return studentApiError(
      "GOALS_LIMIT_EXCEEDED",
      `A maximum of ${MAX_PRIMARY_GOALS} primary goals is allowed`,
      400
    );
  }

  try {
    const view = await saveStudentGoalsView(
      userId,
      body.goals,
      body.planningProfile
    );
    return studentApiSuccess(view);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save goals";
    return studentApiError("GOALS_SAVE_FAILED", message, 400);
  }
}
