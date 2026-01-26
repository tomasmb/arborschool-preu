import { NextRequest, NextResponse } from "next/server";
import {
  analyzeLearningPotential,
  formatRouteForDisplay,
  calculatePAESImprovement,
  DEFAULT_SCORING_CONFIG,
} from "@/lib/diagnostic/questionUnlock";

/**
 * POST /api/diagnostic/learning-routes
 *
 * Calculates personalized learning routes based on diagnostic results.
 * Uses the Question Unlock Algorithm to prioritize atoms by their
 * potential to unlock PAES questions.
 *
 * Route improvements are calculated using the PAES table, with the
 * diagnostic score as the baseline. This ensures improvements are
 * properly capped and don't exceed 1000 total points.
 *
 * Request body:
 * {
 *   atomResults: Array<{ atomId: string, mastered: boolean }>,
 *   diagnosticScore?: number  // Current PAES score from diagnostic formula
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     summary: { ... },
 *     routes: Array<FormattedRoute>,
 *     quickWins: Array<{ atomId, title, questionsUnlocked }>,
 *     improvement: { minPoints, maxPoints, questionsPerTest, percentageOfTest },
 *     lowHangingFruit: { oneAway, twoAway }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { atomResults, diagnosticScore } = body;

    if (!Array.isArray(atomResults)) {
      return NextResponse.json(
        { success: false, error: "atomResults must be an array" },
        { status: 400 }
      );
    }

    // Require diagnostic score - don't use a fallback that could mislead students
    if (typeof diagnosticScore !== "number") {
      return NextResponse.json(
        { success: false, error: "diagnosticScore is required" },
        { status: 400 }
      );
    }

    // Run the analysis with diagnostic score for proper improvement capping
    const analysis = await analyzeLearningPotential(atomResults, {
      currentPaesScore: diagnosticScore,
    });

    const numTests = DEFAULT_SCORING_CONFIG.numOfficialTests;

    // Get routes to process (limit to top 4)
    const topRoutes = analysis.routes.slice(0, 4);

    // Calculate total questions that could be unlocked by all routes
    const totalPotentialUnlocks = topRoutes.reduce(
      (sum, r) => sum + r.totalQuestionsUnlocked,
      0
    );

    // Format routes for frontend display (all questionsUnlocked are per-test average)
    const formattedRoutes = topRoutes.map((route) => ({
      ...formatRouteForDisplay(route),
      axis: route.axis,
      atoms: route.atoms.map((a) => ({
        id: a.atomId,
        title: a.title,
        questionsUnlocked: Math.round(a.questionsUnlockedHere / numTests),
        isPrerequisite: a.isPrerequisite,
      })),
    }));

    // Get quick wins (atoms with immediate impact and no prereqs)
    // questionsUnlocked is per-test average for consistency
    const quickWins = analysis.topAtomsByEfficiency
      .filter((a) => a.immediateUnlocks.length > 0 && a.totalCost === 1)
      .slice(0, 5)
      .map((a) => ({
        atomId: a.atomId,
        title: a.axis,
        axis: a.axis,
        questionsUnlocked: Math.round(a.immediateUnlocks.length / numTests),
      }));

    // Calculate overall improvement using diagnostic score as baseline
    // This ensures improvement + current score doesn't exceed 1000
    const improvement = calculatePAESImprovement(
      diagnosticScore,
      totalPotentialUnlocks,
      numTests
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        masteryByAxis: analysis.masteryByAxis,
        routes: formattedRoutes,
        quickWins,
        improvement,
        // Convert to per-test average (consistent with route questionsUnlocked)
        lowHangingFruit: {
          oneAway: Math.round(
            analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 1)
              .length / numTests
          ),
          twoAway: Math.round(
            analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 2)
              .length / numTests
          ),
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
    const numTests = DEFAULT_SCORING_CONFIG.numOfficialTests;

    const formattedRoutes = analysis.routes.slice(0, 4).map((route) => ({
      ...formatRouteForDisplay(route),
      axis: route.axis,
      atoms: route.atoms.slice(0, 5).map((a) => ({
        id: a.atomId,
        title: a.title,
        questionsUnlocked: Math.round(a.questionsUnlockedHere / numTests),
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
