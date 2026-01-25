import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/resultados/[sessionId]
 *
 * Returns saved diagnostic results for a user.
 * sessionId is the userId.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    const [user] = await db
      .select({
        email: users.email,
        paesScoreMin: users.paesScoreMin,
        paesScoreMax: users.paesScoreMax,
        performanceTier: users.performanceTier,
        topRouteName: users.topRouteName,
        topRouteQuestionsUnlocked: users.topRouteQuestionsUnlocked,
        topRoutePointsGain: users.topRoutePointsGain,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, sessionId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Results not found" }, { status: 404 });
    }

    // Check if user has results saved
    if (!user.paesScoreMin || !user.paesScoreMax) {
      return NextResponse.json(
        { error: "No diagnostic results saved" },
        { status: 404 }
      );
    }

    // Build response
    const response = {
      email: user.email,
      paesScoreMin: user.paesScoreMin,
      paesScoreMax: user.paesScoreMax,
      performanceTier: user.performanceTier,
      topRoute: user.topRouteName
        ? {
            name: user.topRouteName,
            questionsUnlocked: user.topRouteQuestionsUnlocked ?? 0,
            pointsGain: user.topRoutePointsGain ?? 0,
          }
        : null,
      createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Results API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
