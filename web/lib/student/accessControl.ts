import { eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { users, atomMastery } from "@/db/schema";
import { resolveAccessGrant } from "@/lib/auth/accessGrants";

const FREE_TIER_ATOM_LIMIT = 1;

/**
 * Check if a user has full platform access (active subscription).
 * Admins always have full access.
 */
export function hasFullAccess(user: {
  role: string;
  subscriptionStatus: string;
}): boolean {
  if (user.role === "admin") return true;
  return user.subscriptionStatus === "active";
}

/**
 * For "free" users, re-check access_grants in case a grant was added
 * after their last sign-in. If a match is found, upgrade the user
 * record in place (self-healing) so subsequent calls skip re-check.
 */
async function refreshAccessIfStale(
  userId: string,
  current: { role: string; subscriptionStatus: string; email: string }
): Promise<string> {
  if (current.role === "admin" || current.subscriptionStatus === "active") {
    return current.subscriptionStatus;
  }

  const grant = await resolveAccessGrant(current.email);
  if (grant.status !== "active") {
    return current.subscriptionStatus;
  }

  await db
    .update(users)
    .set({
      subscriptionStatus: "active",
      schoolId: grant.schoolId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return "active";
}

/**
 * Count atoms mastered through actual study sessions (not diagnostic).
 * This is what the free-tier limit is based on.
 */
async function countStudyMasteredAtoms(userId: string): Promise<number> {
  const [result] = await db
    .select({ cnt: count() })
    .from(atomMastery)
    .where(
      and(
        eq(atomMastery.userId, userId),
        eq(atomMastery.isMastered, true),
        eq(atomMastery.masterySource, "study")
      )
    );
  return result?.cnt ?? 0;
}

/**
 * Check if a free-tier user can still study a new atom.
 * Free users get 1 mini-clase (study session) before being gated.
 * Diagnostic-sourced mastery does NOT count toward this limit.
 */
export async function canStudyNewAtom(userId: string): Promise<boolean> {
  const user = await db
    .select({
      role: users.role,
      subscriptionStatus: users.subscriptionStatus,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) return false;

  const resolvedStatus = await refreshAccessIfStale(userId, user[0]);
  const effective = { ...user[0], subscriptionStatus: resolvedStatus };

  if (hasFullAccess(effective)) return true;

  const studyMastered = await countStudyMasteredAtoms(userId);
  return studyMastered < FREE_TIER_ATOM_LIMIT;
}

/**
 * Get the user's access status for use in API responses and UI.
 * Re-checks access grants for free users so admin-added grants
 * take effect without requiring a re-login.
 */
export async function getUserAccessStatus(userId: string): Promise<{
  hasAccess: boolean;
  subscriptionStatus: string;
  masteredAtomCount: number;
  freeAtomLimit: number;
}> {
  const user = await db
    .select({
      role: users.role,
      subscriptionStatus: users.subscriptionStatus,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return {
      hasAccess: false,
      subscriptionStatus: "free",
      masteredAtomCount: 0,
      freeAtomLimit: FREE_TIER_ATOM_LIMIT,
    };
  }

  const resolvedStatus = await refreshAccessIfStale(userId, user[0]);
  const effective = { ...user[0], subscriptionStatus: resolvedStatus };
  const isFullAccess = hasFullAccess(effective);

  const studyMastered = await countStudyMasteredAtoms(userId);

  return {
    hasAccess: isFullAccess || studyMastered < FREE_TIER_ATOM_LIMIT,
    subscriptionStatus: resolvedStatus,
    masteredAtomCount: studyMastered,
    freeAtomLimit: FREE_TIER_ATOM_LIMIT,
  };
}
