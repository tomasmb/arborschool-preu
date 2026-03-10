import { createAtomSession } from "@/lib/student/atomMasteryEngine";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

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

  try {
    const result = await createAtomSession(userId, body.atomId);
    return studentApiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create session";
    return studentApiError("SESSION_CREATE_FAILED", message, 400);
  }
}
