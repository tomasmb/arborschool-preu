import { NextRequest, NextResponse } from "next/server";
import { dispatchDueLifecycleReminderJobs } from "@/lib/student/lifecycleReminderDispatch";

type DispatchBody = {
  limit?: number;
};

function readLimit(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function parseBody(request: NextRequest): Promise<DispatchBody | null> {
  try {
    return (await request.json()) as DispatchBody;
  } catch {
    return null;
  }
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.STUDENT_REMINDER_DISPATCH_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

async function runDispatch(request: NextRequest, body: DispatchBody | null) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const queryLimit = readLimit(request.nextUrl.searchParams.get("limit"));
  const bodyLimit =
    body && typeof body.limit === "number" ? body.limit : undefined;
  const limit = bodyLimit ?? queryLimit;

  const result = await dispatchDueLifecycleReminderJobs({ limit });

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      executedAt: new Date().toISOString(),
    },
  });
}

export async function GET(request: NextRequest) {
  return runDispatch(request, null);
}

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  return runDispatch(request, body);
}
