import { NextRequest, NextResponse } from "next/server";
import {
  analyzeLearningPotential,
  formatRouteForDisplay,
  calculatePAESImprovement,
} from "@/lib/diagnostic/questionUnlock";
import { normalizeToTestSize } from "@/lib/diagnostic/scoringConstants";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";

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
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) return authResult.unauthorizedResponse;

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

    const totalQ = analysis.summary.totalQuestions;

    // Get routes to process (limit to top 4)
    const topRoutes = analysis.routes.slice(0, 4);

    // Calculate total questions that could be unlocked by all routes
    const totalPotentialUnlocks = topRoutes.reduce(
      (sum, r) => sum + r.totalQuestionsUnlocked,
      0
    );

    // All questionsUnlocked values are normalized to a 60-question PAES test
    const formattedRoutes = topRoutes.map((route) => ({
      ...formatRouteForDisplay(route, totalQ),
      axis: route.axis,
      atoms: route.atoms.map((a) => ({
        id: a.atomId,
        title: a.title,
        questionsUnlocked: Math.round(
          normalizeToTestSize(a.questionsUnlockedHere, totalQ)
        ),
        isPrerequisite: a.isPrerequisite,
      })),
    }));

    const quickWins = analysis.topAtomsByEfficiency
      .filter((a) => a.immediateUnlocks.length > 0 && a.totalCost === 1)
      .slice(0, 5)
      .map((a) => ({
        atomId: a.atomId,
        title: a.title,
        axis: a.axis,
        questionsUnlocked: Math.round(
          normalizeToTestSize(a.immediateUnlocks.length, totalQ)
        ),
      }));

    const improvement = calculatePAESImprovement(
      diagnosticScore,
      totalPotentialUnlocks,
      totalQ
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        masteryByAxis: analysis.masteryByAxis,
        routes: formattedRoutes,
        quickWins,
        improvement,
        lowHangingFruit: {
          oneAway: Math.round(
            normalizeToTestSize(
              analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 1)
                .length,
              totalQ
            )
          ),
          twoAway: Math.round(
            normalizeToTestSize(
              analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 2)
                .length,
              totalQ
            )
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
