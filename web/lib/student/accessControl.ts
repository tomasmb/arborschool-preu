import { eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { users, atomMastery } from "@/db/schema";

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
 * Check if a free-tier user can still study a new atom.
 * Free users get 1 atom before being gated.
 */
export async function canStudyNewAtom(userId: string): Promise<boolean> {
  const user = await db
    .select({
      role: users.role,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) return false;

  if (hasFullAccess(user[0])) return true;

  const [result] = await db
    .select({ masteredCount: count() })
    .from(atomMastery)
    .where(
      and(eq(atomMastery.userId, userId), eq(atomMastery.isMastered, true))
    );

  return (result?.masteredCount ?? 0) < FREE_TIER_ATOM_LIMIT;
}

/**
 * Get the user's access status for use in API responses and UI.
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

  const isFullAccess = hasFullAccess(user[0]);

  const [result] = await db
    .select({ masteredCount: count() })
    .from(atomMastery)
    .where(
      and(eq(atomMastery.userId, userId), eq(atomMastery.isMastered, true))
    );

  const masteredCount = result?.masteredCount ?? 0;

  return {
    hasAccess: isFullAccess || masteredCount < FREE_TIER_ATOM_LIMIT,
    subscriptionStatus: user[0].subscriptionStatus,
    masteredAtomCount: masteredCount,
    freeAtomLimit: FREE_TIER_ATOM_LIMIT,
  };
}
