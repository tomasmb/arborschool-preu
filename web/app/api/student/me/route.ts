import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import {
  PRIVATE_CACHE_HEADERS,
  studentApiError,
  studentApiSuccess,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const user = await getAuthenticatedUserById(userId);
    if (!user) {
      return studentApiError("USER_NOT_FOUND", "User not found", 404);
    }

    const journey = await getStudentJourneySnapshot(user.id);

    return studentApiSuccess(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        hasDiagnosticSnapshot: user.hasDiagnosticSnapshot,
        journeyState: journey.journeyState,
        hasPlanningProfile: journey.hasPlanningProfile,
        hasActiveMission: journey.hasActiveMission,
      },
      { headers: PRIVATE_CACHE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile";
    return studentApiError("PROFILE_LOAD_FAILED", message, 500);
  }
}
