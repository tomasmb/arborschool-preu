import { createAtomSession } from "@/lib/student/atomMasteryEngine";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";
import { canStudyNewAtom } from "@/lib/student/accessControl";

export async function POST(request: Request) {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: { atomId?: string };
  try {
    body = (await request.json()) as { atomId?: string };
  } catch {
    return studentApiError("INVALID_BODY", "Invalid JSON body", 400);
  }

  if (!body.atomId) {
    return studentApiError("MISSING_FIELDS", "atomId is required", 400);
  }

  const canStudy = await canStudyNewAtom(userId);
  if (!canStudy) {
    return studentApiError(
      "ACCESS_REQUIRED",
      "Has alcanzado el límite del plan gratuito. Contacta a tu colegio o solicita acceso completo.",
      403
    );
  }

  try {
    const result = await createAtomSession(userId, body.atomId);
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create session";
    return studentApiError("SESSION_CREATE_FAILED", message, 400);
  }
}
