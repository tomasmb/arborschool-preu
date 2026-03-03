import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentNextAction } from "@/lib/student/nextAction";

async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    return null;
  }

  return user.id;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const nextActionData = await getStudentNextAction(userId);

  return NextResponse.json({
    success: true,
    data: nextActionData,
  });
}
