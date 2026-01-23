import { NextRequest, NextResponse } from "next/server";
import {
  analyzeLearningPotential,
  formatRouteForDisplay,
  calculatePAESFromUnlocked,
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
 * IMPORTANT: The PAES score is calculated from unlocked questions using
 * the official PAES conversion table. This ensures consistency between
 * the estimated score and the improvement predictions.
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
 *     estimatedScore: { score, min, max, correctPerTest },
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
    const { atomResults } = body;

    if (!Array.isArray(atomResults)) {
      return NextResponse.json(
        { success: false, error: "atomResults must be an array" },
        { status: 400 }
      );
    }

    // Run the analysis
    const analysis = await analyzeLearningPotential(atomResults);

    const numTests = DEFAULT_SCORING_CONFIG.numOfficialTests;

    // Calculate PAES score from currently unlocked questions
    // This is the consistent baseline for all calculations
    const estimatedScore = calculatePAESFromUnlocked(
      analysis.summary.unlockedQuestions,
      numTests
    );

    // Get routes to process (limit to top 4)
    const topRoutes = analysis.routes.slice(0, 4);

    // Calculate total questions that could be unlocked by all routes
    const totalPotentialUnlocks = topRoutes.reduce(
      (sum, r) => sum + r.totalQuestionsUnlocked,
      0
    );

    // Format routes for frontend display (questionsUnlocked becomes per-test average)
    const formattedRoutes = topRoutes.map((route) => ({
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
        title: a.axis,
        axis: a.axis,
        questionsUnlocked: a.immediateUnlocks.length,
      }));

    // Calculate overall improvement using consistent baseline
    const improvement = calculatePAESImprovement(
      estimatedScore.correctPerTest,
      totalPotentialUnlocks,
      numTests
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        estimatedScore,
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
    const numTests = DEFAULT_SCORING_CONFIG.numOfficialTests;

    // Calculate baseline score (fresh start = 0 unlocked)
    const estimatedScore = calculatePAESFromUnlocked(
      analysis.summary.unlockedQuestions,
      numTests
    );

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
        estimatedScore,
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
