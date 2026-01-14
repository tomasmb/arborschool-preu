import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  testAttempts,
  studentResponses,
  atomMastery,
} from "@/db/schema";
import { eq } from "drizzle-orm";

interface StoredResponse {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  stage: number;
  questionIndex: number;
  answeredAt: string;
}

interface DiagnosticData {
  responses: StoredResponse[];
  results: {
    paesMin: number;
    paesMax: number;
    level: string;
    route: string;
    totalCorrect: number;
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

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          role: "student",
        })
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
      // Create a new test attempt
      const [newAttempt] = await db
        .insert(testAttempts)
        .values({
          userId,
          startedAt: new Date(diagnosticData.responses[0].answeredAt),
          completedAt: new Date(),
          totalQuestions: 16,
          correctAnswers: diagnosticData.results?.totalCorrect ?? 0,
          stage1Score: diagnosticData.responses.filter(
            (r) => r.stage === 1 && r.isCorrect
          ).length,
          stage2Difficulty: diagnosticData.results?.route ?? "B",
        })
        .returning({ id: testAttempts.id });

      finalAttemptId = newAttempt.id;

      // Insert all responses
      for (const response of diagnosticData.responses) {
        try {
          await db.insert(studentResponses).values({
            userId,
            testAttemptId: newAttempt.id,
            questionId: response.questionId || null,
            selectedAnswer: response.selectedAnswer,
            isCorrect: response.isCorrect,
            responseTimeSeconds: response.responseTimeSeconds,
            stage: response.stage,
            questionIndex: response.questionIndex,
            answeredAt: new Date(response.answeredAt),
          });
        } catch (err) {
          console.warn(`Failed to insert response:`, err);
        }
      }
    }

    // Create atom mastery records if provided
    if (atomResults && Array.isArray(atomResults)) {
      for (const result of atomResults) {
        try {
          await db
            .insert(atomMastery)
            .values({
              userId,
              atomId: result.atomId,
              status: result.mastered ? "mastered" : "not_started",
              isMastered: result.mastered,
              masterySource: result.mastered ? "diagnostic" : null,
              firstMasteredAt: result.mastered ? new Date() : null,
              lastDemonstratedAt: new Date(),
              totalAttempts: 1,
              correctAttempts: result.mastered ? 1 : 0,
            })
            .onConflictDoNothing();
        } catch {
          console.warn(`Could not create mastery for atom ${result.atomId}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      attemptId: finalAttemptId,
      message: "Account created and diagnostic saved",
    });
  } catch (error) {
    console.error("Failed to signup:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
