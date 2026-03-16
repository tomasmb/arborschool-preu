import { NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts, tests as testsTable } from "@/db/schema";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import {
  getRetestStatus,
  hasCompletedFullTest,
} from "@/lib/student/retestGating";
import {
  getInProgressAttempt,
  resolveTestQuestions,
} from "@/lib/student/fullTest";
import {
  assembleMaxCoverageQuestions,
  getOrCreateCompositeTest,
} from "@/lib/student/fullTestAssembly";
import { getUserAccessStatus } from "@/lib/student/accessControl";
import { eq } from "drizzle-orm";

const DEFAULT_SUBJECT = "paes_m1";

/**
 * POST /api/student/full-test/start
 * Starts a new full timed test — or resumes an in-progress one.
 *
 * New tests use pool-based assembly (greedy set-cover) to maximise atom
 * coverage across the full ~205 M1 concept set. In-progress attempts use
 * the original per-test resolution for crash-recovery consistency.
 */
export async function POST() {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }
    const userId = authResult.userId;

    // Crash recovery: resume an unfinished attempt (uses original resolution)
    const inProgress = await getInProgressAttempt(userId);
    if (inProgress) {
      return handleResumedAttempt(inProgress, userId);
    }

    // Free users get one full test; after that, require active subscription
    const access = await getUserAccessStatus(userId);
    if (access.subscriptionStatus !== "active") {
      const alreadyTested = await hasCompletedFullTest(userId);
      if (alreadyTested) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Ya completaste tu test gratuito. " +
              "Contacta a tu colegio o solicita acceso completo.",
            code: "ACCESS_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    const retestStatus = await getRetestStatus(userId);
    if (!retestStatus.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: retestStatus.blockedReason ?? "No elegible para test",
        },
        { status: 403 }
      );
    }

    // Pool-based assembly: pick 60 questions maximising atom coverage
    const compositeTestId =
      await getOrCreateCompositeTest(DEFAULT_SUBJECT);
    const resolvedQuestions = await assembleMaxCoverageQuestions(
      userId,
      DEFAULT_SUBJECT
    );

    if (resolvedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay preguntas disponibles" },
        { status: 404 }
      );
    }

    const [compositeTest] = await db
      .select({ timeLimitMinutes: testsTable.timeLimitMinutes })
      .from(testsTable)
      .where(eq(testsTable.id, compositeTestId))
      .limit(1);

    const [attempt] = await db
      .insert(testAttempts)
      .values({
        userId,
        testId: compositeTestId,
        startedAt: new Date(),
        totalQuestions: resolvedQuestions.length,
      })
      .returning({ id: testAttempts.id });

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        testName: "PAES M1 — Test Completo",
        timeLimitMinutes: compositeTest?.timeLimitMinutes ?? 135,
        totalQuestions: resolvedQuestions.length,
        questions: resolvedQuestions,
      },
    });
  } catch (error) {
    console.error("Failed to start full test:", error);
    return NextResponse.json(
      { success: false, error: "Error al iniciar el test" },
      { status: 500 }
    );
  }
}

// ============================================================================
// CRASH RECOVERY — RESUME IN-PROGRESS ATTEMPT
// ============================================================================

type InProgressData = Awaited<
  ReturnType<typeof getInProgressAttempt>
> & {};

async function handleResumedAttempt(
  inProgress: NonNullable<InProgressData>,
  userId: string
) {
  const questions = await resolveTestQuestions(
    inProgress.testId,
    userId,
    inProgress.attemptId
  );

  const elapsed = Date.now() - inProgress.startedAt.getTime();
  const elapsedMinutes = elapsed / 60_000;
  const totalMinutes = inProgress.timeLimitMinutes ?? 150;
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);

  if (remainingMinutes <= 0) {
    return NextResponse.json({
      success: true,
      data: {
        attemptId: inProgress.attemptId,
        testName: inProgress.testName,
        timeLimitMinutes: 0,
        totalQuestions: questions.length,
        questions,
        resumed: true,
        expired: true,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      attemptId: inProgress.attemptId,
      testName: inProgress.testName,
      timeLimitMinutes: remainingMinutes,
      totalQuestions: questions.length,
      questions,
      resumed: true,
    },
  });
}
