import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import {
  MAX_PRIMARY_GOALS,
  saveStudentGoalsView,
  type StudentGoalInput,
  getStudentGoalsView,
} from "@/lib/student/goals";

type GoalsRequestBody = {
  goals?: StudentGoalInput[];
};

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

  const view = await getStudentGoalsView(userId);
  return NextResponse.json({
    success: true,
    data: view,
  });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: GoalsRequestBody;
  try {
    body = (await request.json()) as GoalsRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.goals || !Array.isArray(body.goals)) {
    return NextResponse.json(
      { success: false, error: "goals array is required" },
      { status: 400 }
    );
  }

  if (
    body.goals.filter((goal) => goal.isPrimary !== false).length >
    MAX_PRIMARY_GOALS
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `A maximum of ${MAX_PRIMARY_GOALS} primary goals is allowed`,
      },
      { status: 400 }
    );
  }

  try {
    const view = await saveStudentGoalsView(userId, body.goals);
    return NextResponse.json({
      success: true,
      data: view,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save goals";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
