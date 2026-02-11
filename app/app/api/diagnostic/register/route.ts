import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/diagnostic/register
 *
 * Lightweight registration: creates a user with email + mini-form data
 * (userType, curso) before the test begins. If the email already exists,
 * returns the existing user (idempotent).
 *
 * This captures the lead early so drop-offs mid-test are still contactable.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userType, curso } = body as {
      email: string;
      userType?: string;
      curso?: string;
    };

    // Email is required
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
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      // Update mini-form fields on existing user
      await db
        .update(users)
        .set({
          userType: userType ?? undefined,
          curso: curso ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id));

      return NextResponse.json({
        success: true,
        userId: existing[0].id,
      });
    }

    // Create new user with mini-form fields
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        role: "student",
        userType: userType ?? null,
        curso: curso ?? null,
      })
      .returning({ id: users.id });

    return NextResponse.json({
      success: true,
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Failed to register:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register" },
      { status: 500 }
    );
  }
}
