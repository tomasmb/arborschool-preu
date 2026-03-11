/**
 * Test session minting for the dev-only test harness.
 *
 * Encodes a NextAuth v5 JWT with the same payload shape
 * the real signIn flow produces, then sets it as a cookie
 * on the outgoing response.
 */

import { encode } from "@auth/core/jwt";
import { NextResponse } from "next/server";

const COOKIE_NAME = "authjs.session-token";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "[testSession] AUTH_SECRET (or NEXTAUTH_SECRET) is not set"
    );
  }
  return secret;
}

/**
 * Mint a NextAuth-compatible JWT for the given user and set it
 * as a session cookie on `response`.
 */
export async function mintSessionCookie(
  response: NextResponse,
  user: { id: string; email: string; firstName: string | null }
): Promise<void> {
  const secret = getAuthSecret();

  const token = await encode({
    salt: COOKIE_NAME,
    secret,
    maxAge: MAX_AGE_SECONDS,
    token: {
      userId: user.id,
      email: user.email,
      name: user.firstName ?? "Test",
      sub: user.id,
    },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}
