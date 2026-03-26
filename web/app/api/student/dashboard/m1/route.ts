import { getM1DashboardWithData } from "@/lib/student/dashboardM1";
import { getOrCreateCurrentMission } from "@/lib/student/missions";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import { getStudentNextActionWithData } from "@/lib/student/nextAction";
import { getDailyStreak } from "@/lib/student/streakTracker";
import {
  getUserDiagnosticSnapshot,
  getMasteryRows,
} from "@/lib/student/userQueries";
import {
  studentApiError,
  studentApiSuccess,
  PRIVATE_CACHE_HEADERS,
} from "@/lib/student/apiEnvelope";
import { getAuthenticatedStudentUserId } from "@/lib/student/auth";

export async function GET() {
  const userId = await getAuthenticatedStudentUserId();
  if (!userId) {
    return studentApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    // Fetch shared data once — used by both dashboard and nextAction
    const [snapshot, masteryRows] = await Promise.all([
      getUserDiagnosticSnapshot(userId),
      getMasteryRows(userId),
    ]);
    const shared = { snapshot, masteryRows };

    const [dashboard, mission, journey, nextAction, streak] =
      await Promise.all([
        getM1DashboardWithData(userId, shared),
        getOrCreateCurrentMission(userId),
        getStudentJourneySnapshot(userId),
        getStudentNextActionWithData(userId, shared),
        getDailyStreak(userId),
      ]);

    return studentApiSuccess(
      {
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
        nextActionFull: nextAction,
      },
      { headers: PRIVATE_CACHE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard";
    return studentApiError("DASHBOARD_LOAD_FAILED", message, 500);
  }
}
