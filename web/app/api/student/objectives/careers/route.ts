import {
  replaceStudentCareerInterests,
  type CareerInterestInput,
} from "@/lib/student/goals.write";
import {
  getStudentObjectivesView,
} from "@/lib/student/goals";
import { computeInterestPositions } from "@/lib/student/careerPositioning";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

type CareersRequestBody = {
  careerInterests: CareerInterestInput[];
};

/**
 * PUT /api/student/objectives/careers
 *
 * Replaces the student's career interests without touching score targets
 * or profile scores. Used by auto-save on career add/remove.
 */
export async function PUT(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: CareersRequestBody;
  try {
    body = (await request.json()) as CareersRequestBody;
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!Array.isArray(body.careerInterests)) {
    return studentApiError(
      "MISSING_FIELDS",
      "careerInterests array is required",
      400
    );
  }

  try {
    await replaceStudentCareerInterests(userId, body.careerInterests);

    const view = await getStudentObjectivesView(userId);
    const positions = computeInterestPositions(
      view.careerInterests,
      view.options,
      view.scoreTargets,
      view.profileScores
    );

    const careerInterests = view.careerInterests.map((ci) => ({
      ...ci,
      position:
        positions.find((p) => p.offeringId === ci.offeringId) ?? null,
    }));

    return studentApiSuccess({ careerInterests });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save career interests";
    return studentApiError("OBJECTIVES_SAVE_FAILED", message, 400);
  }
}
