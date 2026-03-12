import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

type AdminAuthResult =
  | { userId: string; unauthorizedResponse: null }
  | { userId: null; unauthorizedResponse: NextResponse };

/**
 * Requires the current session user to have the "admin" role.
 * Returns the userId on success, or a 401/403 response on failure.
 */
export async function requireAdminUser(): Promise<AdminAuthResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      userId: null,
      unauthorizedResponse: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user || user.role !== "admin") {
    return {
      userId: null,
      unauthorizedResponse: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { userId: user.id, unauthorizedResponse: null };
}
