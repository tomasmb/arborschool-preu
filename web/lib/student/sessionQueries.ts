/**
 * Shared session query helpers.
 *
 * Centralizes ownership checks and other common session queries used
 * by atomMasteryEngine, prerequisiteScan, and other session-based flows.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { atomStudySessions } from "@/db/schema";

/** Verifies the session belongs to the user. Returns null if not found. */
export async function verifySessionOwnership(
  sessionId: string,
  userId: string
) {
  const [row] = await db
    .select()
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.id, sessionId),
        eq(atomStudySessions.userId, userId)
      )
    )
    .limit(1);
  return row ?? null;
}
