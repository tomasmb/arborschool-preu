import { getOrCreateCurrentMission } from "@/lib/student/missions";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const mission = await getOrCreateCurrentMission(userId);
    return studentApiSuccess(mission);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load mission";
    return studentApiError("MISSION_LOAD_FAILED", message, 500);
  }
}
