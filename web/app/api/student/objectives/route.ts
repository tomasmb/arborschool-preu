import {
  getStudentObjectivesView,
  upsertStudentScoreTarget,
  upsertStudentProfileScore,
} from "@/lib/student/goals";
import { computeInterestPositions } from "@/lib/student/careerPositioning";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import {
  studentApiError,
  studentApiSuccess,
  PRIVATE_CACHE_HEADERS,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

/** Shared response builder for GET and POST. */
async function buildObjectivesPayload(userId: string) {
  const [view, journey] = await Promise.all([
    getStudentObjectivesView(userId),
    getStudentJourneySnapshot(userId),
  ]);

  const positions = computeInterestPositions(
    view.careerInterests,
    view.options,
    view.scoreTargets,
    view.profileScores
  );

  return {
    dataset: view.dataset,
    scoreTargets: view.scoreTargets,
    profileScores: view.profileScores,
    careerInterests: view.careerInterests.map((ci) => ({
      ...ci,
      position: positions.find((p) => p.offeringId === ci.offeringId) ?? null,
    })),
    options: view.options,
    planningProfile: view.planningProfile,
    journeyState: journey.journeyState,
  };
}

/**
 * GET /api/student/objectives
 *
 * Returns the student-centric objectives view: score targets, profile
 * scores, career interests with positioning, and admissions options.
 */
export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const payload = await buildObjectivesPayload(userId);
    return studentApiSuccess(payload, { headers: PRIVATE_CACHE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load objectives";
    return studentApiError("OBJECTIVES_LOAD_FAILED", message, 500);
  }
}

/**
 * PATCH /api/student/objectives
 *
 * Upserts a single score field. Accepts either:
 * - `{ testCode, score }` for PAES score targets (M1, CL, etc.)
 * - `{ scoreType, score }` for profile scores (NEM, RANKING)
 */
export async function PATCH(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: {
    testCode?: string;
    scoreType?: string;
    score?: number;
  };
  try {
    body = await request.json();
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (body.score === undefined) {
    return studentApiError("MISSING_FIELDS", "score is required", 400);
  }

  const isProfile = !!body.scoreType;
  const key = body.scoreType ?? body.testCode;

  if (!key) {
    return studentApiError(
      "MISSING_FIELDS",
      "testCode or scoreType is required",
      400
    );
  }

  try {
    const result = isProfile
      ? await upsertStudentProfileScore(userId, key, body.score)
      : await upsertStudentScoreTarget(userId, key, body.score);
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update score";
    return studentApiError("SCORE_UPDATE_FAILED", message, 400);
  }
}
