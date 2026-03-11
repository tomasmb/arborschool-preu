/**
 * Cascading cleanup for test users created by the dev harness.
 *
 * Most child tables have ON DELETE CASCADE, so deleting the user row
 * is usually enough. We explicitly delete from tables that might not
 * cascade (or where we want to be extra safe) before removing the user.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  atomMastery,
  testAttempts,
  studentResponses,
  atomStudySessions,
  atomStudyResponses,
  studentStudySprintResponses,
  studentStudySprintItems,
  studentStudySprints,
  studentWeeklyMissions,
  studentGoalScores,
  studentGoalBuffers,
  studentGoals,
  studentPlanningProfiles,
  studentReminderJobs,
} from "@/db/schema";

/**
 * Delete a test user and all related data.
 * Ordering: deepest children first, then parents, then the user row.
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  // Atom study responses → sessions
  const sessions = await db
    .select({ id: atomStudySessions.id })
    .from(atomStudySessions)
    .where(eq(atomStudySessions.userId, userId));

  for (const s of sessions) {
    await db
      .delete(atomStudyResponses)
      .where(eq(atomStudyResponses.sessionId, s.id));
  }
  await db
    .delete(atomStudySessions)
    .where(eq(atomStudySessions.userId, userId));

  // Sprint responses → items → sprints
  await db
    .delete(studentStudySprintResponses)
    .where(eq(studentStudySprintResponses.userId, userId));

  const sprints = await db
    .select({ id: studentStudySprints.id })
    .from(studentStudySprints)
    .where(eq(studentStudySprints.userId, userId));

  for (const sp of sprints) {
    await db
      .delete(studentStudySprintItems)
      .where(eq(studentStudySprintItems.sprintId, sp.id));
  }
  await db
    .delete(studentStudySprints)
    .where(eq(studentStudySprints.userId, userId));

  // Test responses → attempts
  await db.delete(studentResponses).where(eq(studentResponses.userId, userId));
  await db.delete(testAttempts).where(eq(testAttempts.userId, userId));

  // Goal scores/buffers → goals
  const goals = await db
    .select({ id: studentGoals.id })
    .from(studentGoals)
    .where(eq(studentGoals.userId, userId));

  for (const g of goals) {
    await db
      .delete(studentGoalScores)
      .where(eq(studentGoalScores.goalId, g.id));
    await db
      .delete(studentGoalBuffers)
      .where(eq(studentGoalBuffers.goalId, g.id));
  }
  await db.delete(studentGoals).where(eq(studentGoals.userId, userId));

  // Standalone child tables
  await db.delete(atomMastery).where(eq(atomMastery.userId, userId));
  await db
    .delete(studentWeeklyMissions)
    .where(eq(studentWeeklyMissions.userId, userId));
  await db
    .delete(studentPlanningProfiles)
    .where(eq(studentPlanningProfiles.userId, userId));
  await db
    .delete(studentReminderJobs)
    .where(eq(studentReminderJobs.userId, userId));

  // Finally, the user row itself
  await db.delete(users).where(eq(users.id, userId));
}
