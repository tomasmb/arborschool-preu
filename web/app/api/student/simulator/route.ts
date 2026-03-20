import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentGoalSimulation } from "@/lib/student/simulator";
import {
  PRIVATE_CACHE_HEADERS,
  studentApiError,
  studentApiSuccess,
} from "@/lib/student/apiEnvelope";

const MIN_SCORE = 100;
const MAX_SCORE = 1000;

type ParsedSimulatorQuery = {
  goalId: string;
  scoreOverrides: Record<string, number | null>;
  bufferPointsOverride?: number;
};

async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return null;
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    return null;
  }

  return user.id;
}

function parseSimulatorQuery(url: URL): ParsedSimulatorQuery | string {
  const goalId = url.searchParams.get("goalId");
  if (!goalId) {
    return "goalId is required";
  }

  const scoreOverrides: Record<string, number | null> = {};
  let bufferPointsOverride: number | undefined;

  for (const [key, rawValue] of url.searchParams.entries()) {
    if (key === "goalId") {
      continue;
    }

    if (key === "bufferPoints") {
      const parsedBuffer = Number(rawValue);
      if (!Number.isInteger(parsedBuffer) || parsedBuffer < 0) {
        return "bufferPoints must be a non-negative integer";
      }
      bufferPointsOverride = parsedBuffer;
      continue;
    }

    const normalizedTestCode = key.trim().toUpperCase();
    if (rawValue.trim().length === 0) {
      scoreOverrides[normalizedTestCode] = null;
      continue;
    }

    const score = Number(rawValue);
    if (!Number.isFinite(score) || score < MIN_SCORE || score > MAX_SCORE) {
      return `${key} must be a number between ${MIN_SCORE} and ${MAX_SCORE}`;
    }

    scoreOverrides[normalizedTestCode] = score;
  }

  return {
    goalId,
    scoreOverrides,
    bufferPointsOverride,
  };
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const url = new URL(request.url);
  const parsed = parseSimulatorQuery(url);
  if (typeof parsed === "string") {
    return studentApiError("INVALID_PARAMS", parsed, 400);
  }

  try {
    const simulation = await getStudentGoalSimulation(userId, parsed.goalId, {
      scoreOverrides: parsed.scoreOverrides,
      bufferPointsOverride: parsed.bufferPointsOverride,
    });

    if (!simulation) {
      return studentApiError("GOAL_NOT_FOUND", "Goal not found", 404);
    }

    return studentApiSuccess(simulation, { headers: PRIVATE_CACHE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load simulation";
    return studentApiError("SIMULATION_LOAD_FAILED", message, 500);
  }
}
