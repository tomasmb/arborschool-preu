import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { resolveAccessGrant } from "./accessGrants";

interface OAuthProfile {
  email: string;
  name: string | null;
}

interface ParsedName {
  firstName: string | null;
  lastName: string | null;
}

export interface AuthenticatedUserRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "student" | "admin";
  subscriptionStatus: string;
  schoolId: string | null;
  hasDiagnosticSnapshot: boolean;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseName(name: string | null): ParsedName {
  if (!name) {
    return { firstName: null, lastName: null };
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function upsertUserFromOAuth(profile: OAuthProfile) {
  const normalizedEmail = normalizeEmail(profile.email);
  const { firstName, lastName } = parseName(profile.name);

  const existing = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      subscriptionStatus: users.subscriptionStatus,
      schoolId: users.schoolId,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    const existingUser = existing[0];
    const nextFirstName = existingUser.firstName ?? firstName;
    const nextLastName = existingUser.lastName ?? lastName;

    // Re-evaluate access grant on each sign-in (picks up new grants)
    const grant = await resolveAccessGrant(normalizedEmail);
    const nextStatus =
      grant.status === "active"
        ? "active"
        : (existingUser.subscriptionStatus ?? "free");
    const nextSchoolId = grant.schoolId ?? existingUser.schoolId;

    const nameChanged =
      nextFirstName !== existingUser.firstName ||
      nextLastName !== existingUser.lastName;
    const accessChanged =
      nextStatus !== existingUser.subscriptionStatus ||
      nextSchoolId !== existingUser.schoolId;

    if (nameChanged || accessChanged) {
      await db
        .update(users)
        .set({
          firstName: nextFirstName,
          lastName: nextLastName,
          subscriptionStatus: nextStatus,
          schoolId: nextSchoolId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      firstName: nextFirstName,
      lastName: nextLastName,
    };
  }

  // New user — check access grants before creating
  const grant = await resolveAccessGrant(normalizedEmail);

  const [createdUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      firstName,
      lastName,
      role: "student",
      subscriptionStatus: grant.status === "active" ? "active" : "free",
      schoolId: grant.schoolId,
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    });

  return createdUser;
}

/**
 * Fetches a user by ID. Wrapped with React cache() so multiple calls
 * within the same server request (e.g. page + API handler) hit the DB
 * only once.
 */
export const getAuthenticatedUserById = cache(
  async (userId: string): Promise<AuthenticatedUserRecord | null> => {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        subscriptionStatus: users.subscriptionStatus,
        schoolId: users.schoolId,
        paesScoreMin: users.paesScoreMin,
        paesScoreMax: users.paesScoreMax,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];

    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      subscriptionStatus: row.subscriptionStatus,
      schoolId: row.schoolId,
      hasDiagnosticSnapshot:
        row.paesScoreMin !== null && row.paesScoreMax !== null,
    };
  }
);
