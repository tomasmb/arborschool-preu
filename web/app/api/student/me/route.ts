import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    return studentApiError("USER_NOT_FOUND", "User not found", 404);
  }

  const journey = await getStudentJourneySnapshot(user.id);

  return studentApiSuccess({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    hasDiagnosticSnapshot: user.hasDiagnosticSnapshot,
    journeyState: journey.journeyState,
    hasPlanningProfile: journey.hasPlanningProfile,
    hasActiveMission: journey.hasActiveMission,
  });
}
