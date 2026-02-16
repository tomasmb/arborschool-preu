import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  testAttempts,
  studentResponses,
  atomMastery,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { computeFullMasteryWithTransitivity } from "@/lib/diagnostic/atomMastery";
import { sendConfirmationEmail, isEmailConfigured } from "@/lib/email";

// ============================================================================
// TYPES
// ============================================================================

interface StoredResponse {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  stage: number;
  questionIndex: number;
  answeredAt: string;
}

interface TopRouteData {
  name: string;
  questionsUnlocked: number;
  pointsGain: number;
}

interface ProfilingData {
  paesGoal?: string;
  paesDate?: string;
  inPreu?: boolean;
}

interface DiagnosticData {
  responses: StoredResponse[];
  results: {
    paesMin: number;
    paesMax: number;
    level: string;
    route: string;
    totalCorrect: number;
    performanceTier?: string;
    topRoute?: TopRouteData;
  } | null;
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * POST /api/diagnostic/profile
 *
 * Saves diagnostic results and optional profiling data for an existing user.
 * Called after the test, from both profiling submit and profiling skip.
 *
 * The user was already created by /api/diagnostic/register before the test,
 * so this endpoint only updates the user with profiling + results data.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, attemptId, profilingData, atomResults, diagnosticData } =
      body as {
        userId: string;
        attemptId: string | null;
        profilingData?: ProfilingData;
        atomResults?: Array<{ atomId: string; mastered: boolean }>;
        diagnosticData?: DiagnosticData;
      };

    // userId is required (user was created in register step)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    // Verify user exists
    const existingUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userEmail = existingUser[0].email;

    // Build update payload: results snapshot + optional profiling fields
    const resultsSnapshot = diagnosticData?.results;
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
      // Results snapshot for email notifications
      paesScoreMin: resultsSnapshot?.paesMin ?? null,
      paesScoreMax: resultsSnapshot?.paesMax ?? null,
      performanceTier: resultsSnapshot?.performanceTier ?? null,
      topRouteName: resultsSnapshot?.topRoute?.name ?? null,
      topRouteQuestionsUnlocked:
        resultsSnapshot?.topRoute?.questionsUnlocked ?? null,
      topRoutePointsGain: resultsSnapshot?.topRoute?.pointsGain ?? null,
    };

    // Add profiling fields if provided
    if (profilingData) {
      if (profilingData.paesGoal)
        updatePayload.paesGoal = profilingData.paesGoal;
      if (profilingData.paesDate)
        updatePayload.paesDate = profilingData.paesDate;
      if (profilingData.inPreu !== undefined) {
        updatePayload.inPreu = profilingData.inPreu;
      }
    }

    // Update user with all collected data
    await db.update(users).set(updatePayload).where(eq(users.id, userId));

    let finalAttemptId = attemptId;

    // Link server attempt to user if not already linked
    if (attemptId && !attemptId.startsWith("local-")) {
      await db
        .update(testAttempts)
        .set({ userId })
        .where(eq(testAttempts.id, attemptId));

      await db
        .update(studentResponses)
        .set({ userId })
        .where(eq(studentResponses.testAttemptId, attemptId));
    }
    // Create records from local attempt data
    else if (diagnosticData && diagnosticData.responses.length > 0) {
      const correctAnswers = diagnosticData.responses.filter(
        (r) => r.isCorrect
      ).length;
      const stage1Score = diagnosticData.responses.filter(
        (r) => r.stage === 1 && r.isCorrect
      ).length;

      if (!diagnosticData.results?.route) {
        return NextResponse.json(
          { success: false, error: "diagnosticData.results.route is required" },
          { status: 400 }
        );
      }

      // Create a new test attempt
      const [newAttempt] = await db
        .insert(testAttempts)
        .values({
          userId,
          startedAt: new Date(diagnosticData.responses[0].answeredAt),
          completedAt: new Date(),
          totalQuestions: 16,
          correctAnswers,
          stage1Score,
          stage2Difficulty: diagnosticData.results.route,
        })
        .returning({ id: testAttempts.id });

      finalAttemptId = newAttempt.id;

      // Filter valid responses and batch insert
      const validResponses = diagnosticData.responses.filter((r) => {
        if (!r.questionId) {
          console.error(
            `Response at stage ${r.stage}, index ${r.questionIndex} missing questionId`
          );
          return false;
        }
        return true;
      });

      if (validResponses.length > 0) {
        const responseValues = validResponses.map((response) => ({
          userId,
          testAttemptId: newAttempt.id,
          questionId: response.questionId,
          selectedAnswer: response.selectedAnswer,
          isCorrect: response.isCorrect,
          responseTimeSeconds: response.responseTimeSeconds,
          stage: response.stage,
          questionIndex: response.questionIndex,
          answeredAt: new Date(response.answeredAt),
        }));

        try {
          await db.insert(studentResponses).values(responseValues);
        } catch (err) {
          console.warn("Failed to batch insert responses:", err);
        }
      }
    }

    // Compute full atom mastery with transitivity and save
    if (atomResults && Array.isArray(atomResults) && atomResults.length > 0) {
      try {
        const fullMastery =
          await computeFullMasteryWithTransitivity(atomResults);

        const masteryRecords = fullMastery.map((result) => ({
          userId,
          atomId: result.atomId,
          status: result.mastered
            ? ("mastered" as const)
            : ("not_started" as const),
          isMastered: result.mastered,
          masterySource: result.mastered ? ("diagnostic" as const) : null,
          firstMasteredAt: result.mastered ? new Date() : null,
          lastDemonstratedAt: result.source === "direct" ? new Date() : null,
          totalAttempts: result.source === "direct" ? 1 : 0,
          correctAttempts:
            result.source === "direct" && result.mastered ? 1 : 0,
        }));

        // Insert in batches
        const BATCH_SIZE = 50;
        for (let i = 0; i < masteryRecords.length; i += BATCH_SIZE) {
          const batch = masteryRecords.slice(i, i + BATCH_SIZE);
          await db.insert(atomMastery).values(batch).onConflictDoNothing();
        }

        console.log(
          `Saved ${masteryRecords.length} atom mastery records ` +
            `(${masteryRecords.filter((r) => r.isMastered).length} mastered)`
        );
      } catch (error) {
        console.error("Failed to compute/save full atom mastery:", error);
      }
    }

    // Send confirmation email (non-blocking)
    if (resultsSnapshot && isEmailConfigured()) {
      try {
        const emailResult = await sendConfirmationEmail(
          { email: userEmail, userId, firstName: undefined },
          {
            paesMin: resultsSnapshot.paesMin,
            paesMax: resultsSnapshot.paesMax,
            performanceTier: resultsSnapshot.performanceTier ?? "average",
            topRoute: resultsSnapshot.topRoute,
          }
        );

        if (emailResult.success) {
          console.log(`[Profile] Confirmation email sent to ${userEmail}`);
        } else {
          console.warn(`[Profile] Failed to send email: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error("[Profile] Email exception:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      attemptId: finalAttemptId,
      message: "Profile saved and diagnostic data linked",
      emailSent: isEmailConfigured() && !!resultsSnapshot,
    });
  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
