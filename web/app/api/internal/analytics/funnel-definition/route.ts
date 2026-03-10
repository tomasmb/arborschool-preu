import { NextRequest, NextResponse } from "next/server";
import { buildCanonicalFunnelInsightDefinition } from "@/lib/analytics/funnelReport";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.STUDENT_ANALYTICS_INTERNAL_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      definition: buildCanonicalFunnelInsightDefinition(),
      generatedAt: new Date().toISOString(),
    },
  });
}
