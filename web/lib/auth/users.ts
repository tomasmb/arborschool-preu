import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

interface GoogleProfile {
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

export async function upsertUserFromGoogleProfile(profile: GoogleProfile) {
  const normalizedEmail = normalizeEmail(profile.email);
  const { firstName, lastName } = parseName(profile.name);

  const existing = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    const existingUser = existing[0];
    const nextFirstName = existingUser.firstName ?? firstName;
    const nextLastName = existingUser.lastName ?? lastName;

    if (
      nextFirstName !== existingUser.firstName ||
      nextLastName !== existingUser.lastName
    ) {
      await db
        .update(users)
        .set({
          firstName: nextFirstName,
          lastName: nextLastName,
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

  const [createdUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      firstName,
      lastName,
      role: "student",
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    });

  return createdUser;
}

export async function getAuthenticatedUserById(
  userId: string
): Promise<AuthenticatedUserRecord | null> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
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
    hasDiagnosticSnapshot:
      row.paesScoreMin !== null && row.paesScoreMax !== null,
  };
}
