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

/**
 * POST /api/diagnostic/signup
 * Creates a user with email and links/creates their test attempt
 * Handles both server-tracked and local-only attempts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, attemptId, atomResults, diagnosticData } = body as {
      email: string;
      attemptId: string | null;
      atomResults?: Array<{ atomId: string; mastered: boolean }>;
      diagnosticData?: DiagnosticData;
    };

    // Email is always required
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    let userId: string;

    // Prepare results snapshot for storage
    const resultsSnapshot = diagnosticData?.results;
    const userDataWithResults = {
      email: email.toLowerCase(),
      role: "student" as const,
      // Store results snapshot for email notifications
      paesScoreMin: resultsSnapshot?.paesMin ?? null,
      paesScoreMax: resultsSnapshot?.paesMax ?? null,
      performanceTier: resultsSnapshot?.performanceTier ?? null,
      topRouteName: resultsSnapshot?.topRoute?.name ?? null,
      topRouteQuestionsUnlocked:
        resultsSnapshot?.topRoute?.questionsUnlocked ?? null,
      topRoutePointsGain: resultsSnapshot?.topRoute?.pointsGain ?? null,
    };

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      // Update existing user with latest results snapshot
      await db
        .update(users)
        .set({
          paesScoreMin: userDataWithResults.paesScoreMin,
          paesScoreMax: userDataWithResults.paesScoreMax,
          performanceTier: userDataWithResults.performanceTier,
          topRouteName: userDataWithResults.topRouteName,
          topRouteQuestionsUnlocked:
            userDataWithResults.topRouteQuestionsUnlocked,
          topRoutePointsGain: userDataWithResults.topRoutePointsGain,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      const [newUser] = await db
        .insert(users)
        .values(userDataWithResults)
        .returning({ id: users.id });
      userId = newUser.id;
    }

    let finalAttemptId = attemptId;

    // If we have a valid server attempt, link it to the user
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
    // If we have diagnostic data from a local attempt, create the records now
    else if (diagnosticData && diagnosticData.responses.length > 0) {
      // Compute correct answers from responses - don't use fallback
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
            `Response at stage ${r.stage}, index ${r.questionIndex} has no questionId`
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

    // Compute full atom mastery with transitivity and save all atoms
    if (atomResults && Array.isArray(atomResults) && atomResults.length > 0) {
      try {
        // Compute full mastery for ALL atoms using transitivity
        const fullMastery =
          await computeFullMasteryWithTransitivity(atomResults);

        // Save all atom mastery records (batch insert for efficiency)
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

        // Insert in batches to avoid overwhelming the database
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
        // Don't fail the signup if atom mastery fails
      }
    }

    // Send confirmation email (non-blocking, don't fail signup if email fails)
    if (resultsSnapshot && isEmailConfigured()) {
      try {
        const emailResult = await sendConfirmationEmail(
          {
            email: email.toLowerCase(),
            userId,
            firstName: undefined, // We don't collect first name at signup
          },
          {
            paesMin: resultsSnapshot.paesMin,
            paesMax: resultsSnapshot.paesMax,
            performanceTier: resultsSnapshot.performanceTier ?? "average",
            topRoute: resultsSnapshot.topRoute,
          }
        );

        if (emailResult.success) {
          console.log(`[Signup] Confirmation email sent to ${email}`);
        } else {
          console.warn(`[Signup] Failed to send email: ${emailResult.error}`);
        }
      } catch (emailError) {
        // Log but don't fail the signup
        console.error("[Signup] Email exception:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      attemptId: finalAttemptId,
      message: "Account created and diagnostic saved",
      emailSent: isEmailConfigured() && !!resultsSnapshot,
    });
  } catch (error) {
    console.error("Failed to signup:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
