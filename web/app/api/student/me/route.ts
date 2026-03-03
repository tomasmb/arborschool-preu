import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      hasDiagnosticSnapshot: user.hasDiagnosticSnapshot,
    },
  });
}
