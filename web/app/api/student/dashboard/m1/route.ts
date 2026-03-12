import { getM1Dashboard } from "@/lib/student/dashboardM1";
import { getOrCreateCurrentMission } from "@/lib/student/missions";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import { getStudentNextAction } from "@/lib/student/nextAction";
import { getDailyStreak } from "@/lib/student/streakTracker";
import { studentApiError, studentApiSuccess } from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const [dashboard, mission, journey, nextAction, streak] = await Promise.all(
      [
        getM1Dashboard(userId),
        getOrCreateCurrentMission(userId),
        getStudentJourneySnapshot(userId),
        getStudentNextAction(userId),
        getDailyStreak(userId),
      ]
    );

    return studentApiSuccess({
      ...dashboard,
      mission,
      streak,
      journeyState: journey.journeyState,
      nextActionSummary: {
        status: nextAction.status,
        hasAction: Boolean(nextAction.nextAction),
        estimatedMinutes: nextAction.nextAction?.studyMinutes ?? null,
        pointsGain: nextAction.nextAction?.pointsGain ?? null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard";
    return studentApiError("DASHBOARD_LOAD_FAILED", message, 500);
  }
}
