import { NextRequest, NextResponse } from "next/server";
import {
  analyzeLearningPotential,
  formatRouteForDisplay,
  calculatePAESImprovement,
  type StudentLearningAnalysis,
} from "@/lib/diagnostic/questionUnlock";

/**
 * POST /api/diagnostic/learning-routes
 *
 * Calculates personalized learning routes based on diagnostic results.
 * Uses the Question Unlock Algorithm to prioritize atoms by their
 * potential to unlock PAES questions.
 *
 * Request body:
 * {
 *   atomResults: Array<{ atomId: string, mastered: boolean }>
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     summary: { ... },
 *     routes: Array<FormattedRoute>,
 *     quickWins: Array<{ atomId, title, questionsUnlocked }>,
 *     improvement: { minPoints, maxPoints, percentageIncrease }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { atomResults } = body;

    if (!Array.isArray(atomResults)) {
      return NextResponse.json(
        { success: false, error: "atomResults must be an array" },
        { status: 400 }
      );
    }

    // Run the analysis
    const analysis = await analyzeLearningPotential(atomResults);

    // Format routes for frontend display
    const formattedRoutes = analysis.routes.slice(0, 4).map((route) => ({
      ...formatRouteForDisplay(route),
      axis: route.axis,
      atoms: route.atoms.map((a) => ({
        id: a.atomId,
        title: a.title,
        questionsUnlocked: a.questionsUnlockedHere,
        isPrerequisite: a.isPrerequisite,
      })),
    }));

    // Get quick wins (atoms with immediate impact and no prereqs)
    const quickWins = analysis.topAtomsByEfficiency
      .filter((a) => a.immediateUnlocks.length > 0 && a.totalCost === 1)
      .slice(0, 5)
      .map((a) => ({
        atomId: a.atomId,
        title: a.title,
        axis: a.axis,
        questionsUnlocked: a.immediateUnlocks.length,
      }));

    // Calculate overall improvement potential
    const totalPotentialUnlocks = formattedRoutes.reduce(
      (sum, r) => sum + r.questionsUnlocked,
      0
    );
    const improvement = calculatePAESImprovement(totalPotentialUnlocks);

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        routes: formattedRoutes,
        quickWins,
        improvement,
        lowHangingFruit: {
          oneAway: analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 1)
            .length,
          twoAway: analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 2)
            .length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to calculate learning routes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate learning routes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/diagnostic/learning-routes
 *
 * Returns learning routes for a "fresh start" student.
 * Useful for showing the full learning landscape.
 */
export async function GET() {
  try {
    const analysis = await analyzeLearningPotential([]);

    const formattedRoutes = analysis.routes.slice(0, 4).map((route) => ({
      ...formatRouteForDisplay(route),
      axis: route.axis,
      atoms: route.atoms.slice(0, 5).map((a) => ({
        id: a.atomId,
        title: a.title,
        questionsUnlocked: a.questionsUnlockedHere,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        routes: formattedRoutes,
      },
    });
  } catch (error) {
    console.error("Failed to get learning routes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get learning routes" },
      { status: 500 }
    );
  }
}
