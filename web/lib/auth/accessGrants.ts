import { eq, or, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { accessGrants } from "@/db/schema";

interface AccessGrantResult {
  status: "active" | "free";
  schoolId: string | null;
}

/**
 * Check if an email matches any access grant (exact email or domain pattern).
 * Returns the resolved subscription status and optional school link.
 */
export async function resolveAccessGrant(
  email: string
): Promise<AccessGrantResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1];

  if (!domain) {
    return { status: "free", schoolId: null };
  }

  const domainValue = `@${domain}`;

  const grants = await db
    .select({
      schoolId: accessGrants.schoolId,
      type: accessGrants.type,
    })
    .from(accessGrants)
    .where(
      or(
        and(
          eq(accessGrants.type, "email"),
          eq(accessGrants.value, normalizedEmail)
        ),
        and(
          eq(accessGrants.type, "domain"),
          eq(accessGrants.value, domainValue)
        )
      )
    )
    .limit(1);

  if (grants.length === 0) {
    return { status: "free", schoolId: null };
  }

  return {
    status: "active",
    schoolId: grants[0].schoolId,
  };
}
