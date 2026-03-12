/**
 * Shared user-level query helpers.
 *
 * Centralizes reads from `users` and `atom_mastery` that are needed
 * by nextAction, dashboardM1, and other student modules.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atomMastery, users } from "@/db/schema";

export type DiagnosticSnapshot = {
  paesScoreMin: number | null;
  paesScoreMax: number | null;
};

export type MasteryRow = {
  atomId: string;
  isMastered: boolean;
  cooldown: number | null;
};

/** Reads the user's diagnostic min/max PAES score. */
export async function getUserDiagnosticSnapshot(
  userId: string
): Promise<DiagnosticSnapshot | null> {
  const [row] = await db
    .select({
      paesScoreMin: users.paesScoreMin,
      paesScoreMax: users.paesScoreMax,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

/**
 * Fetches all atom_mastery rows for a user. Includes cooldown count
 * so callers can filter as needed.
 */
export async function getMasteryRows(userId: string): Promise<MasteryRow[]> {
  return db
    .select({
      atomId: atomMastery.atomId,
      isMastered: atomMastery.isMastered,
      cooldown: atomMastery.cooldownUntilMasteryCount,
    })
    .from(atomMastery)
    .where(eq(atomMastery.userId, userId));
}
