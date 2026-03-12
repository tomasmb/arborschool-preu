import { NextResponse } from "next/server";
import { getAuthenticatedStudentUserId } from "./auth";

type AuthenticatedStudentResult =
  | { userId: string; unauthorizedResponse: null }
  | { userId: null; unauthorizedResponse: NextResponse };

export async function requireAuthenticatedStudentUser(): Promise<AuthenticatedStudentResult> {
  const userId = await getAuthenticatedStudentUserId();

  if (!userId) {
    return {
      userId: null,
      unauthorizedResponse: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { userId, unauthorizedResponse: null };
}
