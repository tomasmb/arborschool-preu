import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  studentPlanningProfiles,
  studentWeeklyMissions,
  studentStudySprints,
  testAttempts,
  users,
} from "@/db/schema";
import { currentWeekStartDate } from "@/lib/shared/dateHelpers";

export type StudentJourneyState =
  | "planning_required"
  | "diagnostic_in_progress"
  | "activation_ready"
  | "active_learning";

export type StudentJourneySnapshot = {
  journeyState: StudentJourneyState;
  hasPlanningProfile: boolean;
  hasDiagnosticSnapshot: boolean;
  hasActiveMission: boolean;
};

export async function getStudentJourneySnapshot(
  userId: string
): Promise<StudentJourneySnapshot> {
  const weekStartDate = currentWeekStartDate();

  const [userRow, planningRow, inProgressAttempt, completedSprint, missionRow] =
    await Promise.all([
      db
        .select({
          paesScoreMin: users.paesScoreMin,
          paesScoreMax: users.paesScoreMax,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({ id: studentPlanningProfiles.id })
        .from(studentPlanningProfiles)
        .where(eq(studentPlanningProfiles.userId, userId))
        .limit(1),
      db
        .select({ id: testAttempts.id })
        .from(testAttempts)
        .where(
          and(eq(testAttempts.userId, userId), isNull(testAttempts.completedAt))
        )
        .orderBy(desc(testAttempts.startedAt))
        .limit(1),
      db
        .select({ id: studentStudySprints.id })
        .from(studentStudySprints)
        .where(
          and(
            eq(studentStudySprints.userId, userId),
            isNotNull(studentStudySprints.completedAt)
          )
        )
        .limit(1),
      db
        .select({ id: studentWeeklyMissions.id })
        .from(studentWeeklyMissions)
        .where(
          and(
            eq(studentWeeklyMissions.userId, userId),
            eq(studentWeeklyMissions.weekStartDate, weekStartDate)
          )
        )
        .limit(1),
    ]);

  const hasDiagnosticSnapshot = Boolean(
    userRow[0]?.paesScoreMin !== null && userRow[0]?.paesScoreMax !== null
  );
  const hasPlanningProfile = planningRow.length > 0;
  const hasInProgressDiagnostic = inProgressAttempt.length > 0;
  const hasCompletedSprint = completedSprint.length > 0;
  const hasMissionThisWeek = missionRow.length > 0;

  const journeyState: StudentJourneyState = hasDiagnosticSnapshot
    ? hasCompletedSprint
      ? "active_learning"
      : "activation_ready"
    : hasInProgressDiagnostic
      ? "diagnostic_in_progress"
      : "planning_required";

  return {
    journeyState,
    hasPlanningProfile,
    hasDiagnosticSnapshot,
    hasActiveMission: hasMissionThisWeek || hasCompletedSprint,
  };
}

export function resolvePostLoginRouteByJourneyState(
  journeyState: StudentJourneyState
): "/portal/goals?mode=planning" | "/diagnostico" | "/portal" {
  if (journeyState === "planning_required") {
    return "/portal/goals?mode=planning";
  }

  if (journeyState === "diagnostic_in_progress") {
    return "/diagnostico";
  }

  return "/portal";
}
