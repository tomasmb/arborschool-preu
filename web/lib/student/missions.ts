import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { studentWeeklyMissions } from "@/db/schema";
import { getCurrentWeekRange } from "@/lib/shared/dateHelpers";

export type StudentMission = {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  targetSessions: number;
  completedSessions: number;
  status: string;
};

function mapMissionRow(row: {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  targetSessions: number;
  completedSessions: number;
  status: string;
}): StudentMission {
  return {
    id: row.id,
    weekStartDate: row.weekStartDate,
    weekEndDate: row.weekEndDate,
    targetSessions: row.targetSessions,
    completedSessions: row.completedSessions,
    status: row.status,
  };
}

export async function getOrCreateCurrentMission(
  userId: string,
  targetSessions = 5
): Promise<StudentMission> {
  const { weekStartDate, weekEndDate } = getCurrentWeekRange();

  const existing = await db
    .select({
      id: studentWeeklyMissions.id,
      weekStartDate: studentWeeklyMissions.weekStartDate,
      weekEndDate: studentWeeklyMissions.weekEndDate,
      targetSessions: studentWeeklyMissions.targetSessions,
      completedSessions: studentWeeklyMissions.completedSessions,
      status: studentWeeklyMissions.status,
    })
    .from(studentWeeklyMissions)
    .where(
      and(
        eq(studentWeeklyMissions.userId, userId),
        eq(studentWeeklyMissions.weekStartDate, weekStartDate)
      )
    )
    .limit(1);

  if (existing[0]) {
    return mapMissionRow(existing[0]);
  }

  const [created] = await db
    .insert(studentWeeklyMissions)
    .values({
      userId,
      weekStartDate,
      weekEndDate,
      targetSessions,
      completedSessions: 0,
      status: "active",
      updatedAt: new Date(),
    })
    .returning({
      id: studentWeeklyMissions.id,
      weekStartDate: studentWeeklyMissions.weekStartDate,
      weekEndDate: studentWeeklyMissions.weekEndDate,
      targetSessions: studentWeeklyMissions.targetSessions,
      completedSessions: studentWeeklyMissions.completedSessions,
      status: studentWeeklyMissions.status,
    });

  return mapMissionRow(created);
}

export async function incrementMissionProgress(
  userId: string
): Promise<StudentMission> {
  const mission = await getOrCreateCurrentMission(userId);

  await db
    .update(studentWeeklyMissions)
    .set({
      completedSessions: sql`${studentWeeklyMissions.completedSessions} + 1`,
      lastProgressAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(studentWeeklyMissions.id, mission.id));

  const [updated] = await db
    .select({
      id: studentWeeklyMissions.id,
      weekStartDate: studentWeeklyMissions.weekStartDate,
      weekEndDate: studentWeeklyMissions.weekEndDate,
      targetSessions: studentWeeklyMissions.targetSessions,
      completedSessions: studentWeeklyMissions.completedSessions,
      status: studentWeeklyMissions.status,
    })
    .from(studentWeeklyMissions)
    .where(eq(studentWeeklyMissions.id, mission.id))
    .limit(1);

  if (!updated) {
    return mission;
  }

  if (
    updated.completedSessions >= updated.targetSessions &&
    updated.status !== "completed"
  ) {
    await db
      .update(studentWeeklyMissions)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(studentWeeklyMissions.id, updated.id));

    return {
      ...mapMissionRow(updated),
      status: "completed",
    };
  }

  return mapMissionRow(updated);
}
