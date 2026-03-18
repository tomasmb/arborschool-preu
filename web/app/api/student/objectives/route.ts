import {
  getStudentObjectivesView,
  saveStudentObjectives,
  upsertStudentScoreTarget,
  type StudentPlanningProfileInput,
} from "@/lib/student/goals";
import { computeInterestPositions } from "@/lib/student/careerPositioning";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";
import type {
  ScoreTargetInput,
  ProfileScoreInput,
  CareerInterestInput,
} from "@/lib/student/goals.write";

type ObjectivesRequestBody = {
  scoreTargets?: ScoreTargetInput[];
  profileScores?: ProfileScoreInput[];
  careerInterests?: CareerInterestInput[];
  planningProfile?: StudentPlanningProfileInput;
};

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
    return studentApiSuccess(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load objectives";
    return studentApiError("OBJECTIVES_LOAD_FAILED", message, 500);
  }
}

/**
 * POST /api/student/objectives
 *
 * Saves all student objectives at once: score targets, profile scores,
 * career interests, and optional planning profile.
 */
export async function POST(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: ObjectivesRequestBody;
  try {
    body = (await request.json()) as ObjectivesRequestBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  try {
    await saveStudentObjectives(userId, {
      scoreTargets: body.scoreTargets ?? [],
      profileScores: body.profileScores ?? [],
      careerInterests: body.careerInterests ?? [],
      planningProfile: body.planningProfile,
    });

    const payload = await buildObjectivesPayload(userId);
    return studentApiSuccess(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save objectives";
    return studentApiError("OBJECTIVES_SAVE_FAILED", message, 400);
  }
}

/**
 * PATCH /api/student/objectives
 *
 * Upserts a single score target (e.g. from the dashboard M1 editor).
 */
export async function PATCH(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: { testCode?: string; score?: number };
  try {
    body = (await request.json()) as { testCode?: string; score?: number };
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!body.testCode || body.score === undefined) {
    return studentApiError(
      "MISSING_FIELDS",
      "testCode and score are required",
      400
    );
  }

  try {
    const result = await upsertStudentScoreTarget(
      userId,
      body.testCode,
      body.score
    );
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update score target";
    return studentApiError("SCORE_UPDATE_FAILED", message, 400);
  }
}
