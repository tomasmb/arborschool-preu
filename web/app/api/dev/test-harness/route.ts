/**
 * Dev-only test harness API.
 *
 * POST /api/dev/test-harness
 *
 * Actions:
 *   create_user  — create a user at a journey preset + mint session cookie
 *   seed_state   — layer additional data onto an existing user
 *   cleanup      — delete a test user and all related data
 *
 * Hard-blocked unless NODE_ENV === "development".
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createUserAtPreset,
  applySeedState,
  type JourneyPreset,
  type SeedState,
} from "@/lib/dev/testSeeder";
import { mintSessionCookie } from "@/lib/dev/testSession";
import { cleanupTestUser } from "@/lib/dev/testCleanup";

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

type CreateUserPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  journeyPreset: JourneyPreset;
};

type SeedStatePayload = {
  userId: string;
  seed: SeedState;
};

type CleanupPayload = {
  userId: string;
};

type HarnessBody =
  | { action: "create_user"; payload: CreateUserPayload }
  | { action: "seed_state"; payload: SeedStatePayload }
  | { action: "cleanup"; payload: CleanupPayload };

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_PRESETS: JourneyPreset[] = [
  "fresh",
  "planning_done",
  "diagnostic_done",
  "active",
];

const VALID_SEEDS: SeedState[] = [
  "mastery_atoms_18",
  "mastery_atoms_30",
  "full_test_completed",
  "cooldown_atom",
  "sr_review_due",
  "streak_5",
  "mission_complete",
  "multiple_history_points",
  "reminders_off",
];

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!isDev()) {
    return new NextResponse(null, { status: 404 });
  }

  let body: HarnessBody;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body.action || !body.payload) {
    return jsonError("Missing action or payload", 400);
  }

  try {
    switch (body.action) {
      // -------------------------------------------------------------------
      // create_user
      // -------------------------------------------------------------------
      case "create_user": {
        const { journeyPreset, email, firstName, lastName } = body.payload;

        if (!journeyPreset || !VALID_PRESETS.includes(journeyPreset)) {
          return jsonError(
            `Invalid journeyPreset. Must be one of: ${VALID_PRESETS.join(", ")}`,
            400
          );
        }

        if (email && !email.endsWith("@arbor.local")) {
          return jsonError("Test emails must use @arbor.local domain", 400);
        }

        const user = await createUserAtPreset(journeyPreset, {
          email,
          firstName,
          lastName,
        });

        const response = NextResponse.json({
          success: true,
          data: { userId: user.id, email: user.email, journeyPreset },
        });

        await mintSessionCookie(response, {
          id: user.id,
          email: user.email,
          firstName: firstName ?? "Test",
        });

        return response;
      }

      // -------------------------------------------------------------------
      // seed_state
      // -------------------------------------------------------------------
      case "seed_state": {
        const { userId, seed } = body.payload;

        if (!userId) {
          return jsonError("Missing userId", 400);
        }

        if (!seed || !VALID_SEEDS.includes(seed)) {
          return jsonError(
            `Invalid seed. Must be one of: ${VALID_SEEDS.join(", ")}`,
            400
          );
        }

        await applySeedState(userId, seed);

        return NextResponse.json({
          success: true,
          data: { userId, seed },
        });
      }

      // -------------------------------------------------------------------
      // cleanup
      // -------------------------------------------------------------------
      case "cleanup": {
        const { userId } = body.payload;

        if (!userId) {
          return jsonError("Missing userId", 400);
        }

        await cleanupTestUser(userId);

        return NextResponse.json({
          success: true,
          data: { userId, deleted: true },
        });
      }

      default:
        return jsonError(
          "Unknown action. Must be create_user, seed_state, or cleanup",
          400
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal harness error";
    console.error("[test-harness]", error);
    return jsonError(message, 500);
  }
}
