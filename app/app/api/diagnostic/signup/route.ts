import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  testAttempts,
  studentResponses,
  atomMastery,
} from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/diagnostic/signup
 * Creates a user with email and optionally links their test attempt
 * Also creates atom mastery records based on diagnostic results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, attemptId, atomResults } = body;

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
      // User exists, use their ID
      userId = existingUsers[0].id;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          role: "student",
        })
        .returning({ id: users.id });
      userId = newUser.id;
    }

    // Only link test attempt if we have a valid (non-local) attemptId
    const hasValidAttempt = attemptId && !attemptId.startsWith("local-");

    if (hasValidAttempt) {
      // Link test attempt to user
      await db
        .update(testAttempts)
        .set({ userId })
        .where(eq(testAttempts.id, attemptId));

      // Link all responses to user
      await db
        .update(studentResponses)
        .set({ userId })
        .where(eq(studentResponses.testAttemptId, attemptId));
    }

    // Create atom mastery records if provided
    if (atomResults && Array.isArray(atomResults)) {
      for (const result of atomResults) {
        // Upsert atom mastery - if exists, only update if not already mastered
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
          // Ignore individual atom mastery errors (foreign key constraints)
          console.warn(`Could not create mastery for atom ${result.atomId}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: hasValidAttempt
        ? "Account created and diagnostic linked"
        : "Account created - diagnostic data saved locally",
    });
  } catch (error) {
    console.error("Failed to signup:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
