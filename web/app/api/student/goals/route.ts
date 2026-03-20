import {
  MAX_PRIMARY_GOALS,
  saveStudentGoalsView,
  type StudentPlanningProfileInput,
  type StudentGoalInput,
  getStudentGoalsView,
} from "@/lib/student/goals";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import {
  studentApiError,
  studentApiSuccess,
  PRIVATE_CACHE_HEADERS,
} from "@/lib/student/apiEnvelope";
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

  try {
    const [view, journey] = await Promise.all([
      getStudentGoalsView(userId),
      getStudentJourneySnapshot(userId),
    ]);
    return studentApiSuccess(
      { ...view, journeyState: journey.journeyState },
      { headers: PRIVATE_CACHE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load goals";
    return studentApiError("GOALS_LOAD_FAILED", message, 500);
  }
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
    const [view, journey] = await Promise.all([
      saveStudentGoalsView(userId, body.goals, body.planningProfile),
      getStudentJourneySnapshot(userId),
    ]);
    return studentApiSuccess({
      ...view,
      journeyState: journey.journeyState,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save goals";
    return studentApiError("GOALS_SAVE_FAILED", message, 400);
  }
}
