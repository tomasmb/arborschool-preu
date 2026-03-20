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

export type UserAccessInput = {
  role: string;
  subscriptionStatus: string;
  email: string;
};

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
 *
 * Accepts optional pre-fetched user data to skip a redundant DB query.
 */
export async function canStudyNewAtom(
  userId: string,
  prefetchedUser?: UserAccessInput
): Promise<boolean> {
  let userRow: UserAccessInput;

  if (prefetchedUser) {
    userRow = prefetchedUser;
  } else {
    const rows = await db
      .select({
        role: users.role,
        subscriptionStatus: users.subscriptionStatus,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (rows.length === 0) return false;
    userRow = rows[0];
  }

  const resolvedStatus = await refreshAccessIfStale(userId, userRow);
  const effective = { ...userRow, subscriptionStatus: resolvedStatus };

  if (hasFullAccess(effective)) return true;

  const studyMastered = await countStudyMasteredAtoms(userId);
  return studyMastered < FREE_TIER_ATOM_LIMIT;
}

/**
 * Get the user's access status for use in API responses and UI.
 * Accepts optional pre-fetched user data to avoid a redundant DB query
 * when the caller already has it (e.g. from getAuthenticatedUserById).
 * For active/admin users, skips the mastery count query entirely.
 */
export async function getUserAccessStatus(
  userId: string,
  prefetchedUser?: UserAccessInput
): Promise<{
  hasAccess: boolean;
  subscriptionStatus: string;
  masteredAtomCount: number;
  freeAtomLimit: number;
}> {
  let userRow: UserAccessInput;

  if (prefetchedUser) {
    userRow = prefetchedUser;
  } else {
    const rows = await db
      .select({
        role: users.role,
        subscriptionStatus: users.subscriptionStatus,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (rows.length === 0) {
      return {
        hasAccess: false,
        subscriptionStatus: "free",
        masteredAtomCount: 0,
        freeAtomLimit: FREE_TIER_ATOM_LIMIT,
      };
    }

    userRow = rows[0];
  }

  const resolvedStatus = await refreshAccessIfStale(userId, userRow);
  const effective = { ...userRow, subscriptionStatus: resolvedStatus };
  const isFullAccess = hasFullAccess(effective);

  // Active/admin users have full access -- no need to count study mastery
  if (isFullAccess) {
    return {
      hasAccess: true,
      subscriptionStatus: resolvedStatus,
      masteredAtomCount: 0,
      freeAtomLimit: FREE_TIER_ATOM_LIMIT,
    };
  }

  const studyMastered = await countStudyMasteredAtoms(userId);

  return {
    hasAccess: studyMastered < FREE_TIER_ATOM_LIMIT,
    subscriptionStatus: resolvedStatus,
    masteredAtomCount: studyMastered,
    freeAtomLimit: FREE_TIER_ATOM_LIMIT,
  };
}
