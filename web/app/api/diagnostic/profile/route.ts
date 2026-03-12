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
import { isEmailConfigured } from "@/lib/email";
import { requireAuthenticatedStudentUser } from "@/lib/student/apiAuth";
import {
  forbiddenResponse,
  notFoundResponse,
  missingRouteResponse,
} from "./responseErrors";
import { processProfileEmails } from "./profileEmail";
import type {
  StoredResponse,
  ProfilingData,
  DiagnosticData,
  ProfileRequestBody,
  ResultsSnapshot,
} from "./types";

const LOCAL_ATTEMPT_PREFIX = "local-";
const TOTAL_QUESTIONS = 16;
const MASTERY_BATCH_SIZE = 50;

function isLocalAttempt(attemptId: string | null): boolean {
  return !!attemptId && attemptId.startsWith(LOCAL_ATTEMPT_PREFIX);
}

function hasDiagnosticResponses(
  diagnosticData?: DiagnosticData
): diagnosticData is DiagnosticData {
  return !!diagnosticData && diagnosticData.responses.length > 0;
}

async function parseBody(request: NextRequest): Promise<ProfileRequestBody> {
  return (await request.json()) as ProfileRequestBody;
}

async function findUser(userId: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

function buildResultsSnapshotPayload(
  resultsSnapshot: ResultsSnapshot | null
): Record<string, unknown> {
  if (!resultsSnapshot) {
    return {
      paesScoreMin: null,
      paesScoreMax: null,
      performanceTier: null,
      topRouteName: null,
      topRouteQuestionsUnlocked: null,
      topRoutePointsGain: null,
    };
  }

  return {
    paesScoreMin: resultsSnapshot.paesMin,
    paesScoreMax: resultsSnapshot.paesMax,
    performanceTier: resultsSnapshot.performanceTier ?? null,
    topRouteName: resultsSnapshot.topRoute?.name ?? null,
    topRouteQuestionsUnlocked:
      resultsSnapshot.topRoute?.questionsUnlocked ?? null,
    topRoutePointsGain: resultsSnapshot.topRoute?.pointsGain ?? null,
  };
}

function applyProfilingFields(
  payload: Record<string, unknown>,
  profilingData?: ProfilingData
) {
  if (!profilingData) {
    return;
  }

  if (profilingData.paesGoal) {
    payload.paesGoal = profilingData.paesGoal;
  }
  if (profilingData.paesDate) {
    payload.paesDate = profilingData.paesDate;
  }
  if (profilingData.inPreu !== undefined) {
    payload.inPreu = profilingData.inPreu;
  }
}

function buildUserUpdatePayload(
  resultsSnapshot: ResultsSnapshot | null,
  profilingData?: ProfilingData
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    updatedAt: new Date(),
    ...buildResultsSnapshotPayload(resultsSnapshot),
  };

  applyProfilingFields(payload, profilingData);
  return payload;
}

async function updateUserProfileSnapshot(params: {
  userId: string;
  resultsSnapshot: ResultsSnapshot | null;
  profilingData?: ProfilingData;
}) {
  await db
    .update(users)
    .set(buildUserUpdatePayload(params.resultsSnapshot, params.profilingData))
    .where(eq(users.id, params.userId));
}

async function linkRemoteAttemptToUser(userId: string, attemptId: string) {
  await db
    .update(testAttempts)
    .set({ userId })
    .where(eq(testAttempts.id, attemptId));
  await db
    .update(studentResponses)
    .set({ userId })
    .where(eq(studentResponses.testAttemptId, attemptId));
}

function getResponseMetrics(responses: StoredResponse[]) {
  const correctAnswers = responses.filter(
    (response) => response.isCorrect
  ).length;
  const stage1Score = responses.filter(
    (response) => response.stage === 1 && response.isCorrect
  ).length;

  return { correctAnswers, stage1Score };
}

function buildInsertableResponses(params: {
  userId: string;
  attemptId: string;
  responses: StoredResponse[];
}) {
  return params.responses
    .filter((response) => {
      if (response.questionId) {
        return true;
      }

      console.error(
        `Response at stage ${response.stage}, index ${response.questionIndex} missing questionId`
      );
      return false;
    })
    .map((response) => ({
      userId: params.userId,
      testAttemptId: params.attemptId,
      questionId: response.questionId,
      selectedAnswer: response.selectedAnswer,
      isCorrect: response.isCorrect,
      responseTimeSeconds: response.responseTimeSeconds,
      stage: response.stage,
      questionIndex: response.questionIndex,
      answeredAt: new Date(response.answeredAt),
    }));
}

async function createAttemptFromDiagnosticData(params: {
  userId: string;
  diagnosticData: DiagnosticData;
}): Promise<{ attemptId: string } | { errorResponse: NextResponse }> {
  if (!params.diagnosticData.results?.route) {
    return { errorResponse: missingRouteResponse() };
  }

  const { correctAnswers, stage1Score } = getResponseMetrics(
    params.diagnosticData.responses
  );

  const [newAttempt] = await db
    .insert(testAttempts)
    .values({
      userId: params.userId,
      startedAt: new Date(params.diagnosticData.responses[0].answeredAt),
      completedAt: new Date(),
      totalQuestions: TOTAL_QUESTIONS,
      correctAnswers,
      stage1Score,
      stage2Difficulty: params.diagnosticData.results.route,
    })
    .returning({ id: testAttempts.id });

  const responseValues = buildInsertableResponses({
    userId: params.userId,
    attemptId: newAttempt.id,
    responses: params.diagnosticData.responses,
  });

  if (responseValues.length > 0) {
    try {
      await db.insert(studentResponses).values(responseValues);
    } catch (error) {
      console.warn("Failed to batch insert responses:", error);
    }
  }

  return { attemptId: newAttempt.id };
}

async function resolveAttemptId(params: {
  userId: string;
  attemptId: string | null;
  diagnosticData?: DiagnosticData;
}): Promise<{ attemptId: string | null } | { errorResponse: NextResponse }> {
  if (params.attemptId && !isLocalAttempt(params.attemptId)) {
    await linkRemoteAttemptToUser(params.userId, params.attemptId);
    return { attemptId: params.attemptId };
  }

  if (!hasDiagnosticResponses(params.diagnosticData)) {
    return { attemptId: params.attemptId };
  }

  const created = await createAttemptFromDiagnosticData({
    userId: params.userId,
    diagnosticData: params.diagnosticData,
  });

  if ("errorResponse" in created) {
    return created;
  }

  return { attemptId: created.attemptId };
}

function hasAtomResults(
  atomResults?: Array<{ atomId: string; mastered: boolean }>
): atomResults is Array<{ atomId: string; mastered: boolean }> {
  return Array.isArray(atomResults) && atomResults.length > 0;
}

async function saveAtomMastery(params: {
  userId: string;
  atomResults?: Array<{ atomId: string; mastered: boolean }>;
}) {
  if (!hasAtomResults(params.atomResults)) {
    return;
  }

  try {
    const fullMastery = await computeFullMasteryWithTransitivity(
      params.atomResults
    );
    const now = new Date();

    const masteryRecords = fullMastery.map((result) => ({
      userId: params.userId,
      atomId: result.atomId,
      status: result.mastered
        ? ("mastered" as const)
        : ("not_started" as const),
      isMastered: result.mastered,
      masterySource: result.mastered ? ("diagnostic" as const) : null,
      firstMasteredAt: result.mastered ? now : null,
      lastDemonstratedAt: result.source === "direct" ? now : null,
      totalAttempts: result.source === "direct" ? 1 : 0,
      correctAttempts: result.source === "direct" && result.mastered ? 1 : 0,
    }));

    for (
      let index = 0;
      index < masteryRecords.length;
      index += MASTERY_BATCH_SIZE
    ) {
      const batch = masteryRecords.slice(index, index + MASTERY_BATCH_SIZE);
      await db.insert(atomMastery).values(batch).onConflictDoNothing();
    }

    console.log(
      `Saved ${masteryRecords.length} atom mastery records ` +
        `(${masteryRecords.filter((record) => record.isMastered).length} mastered)`
    );
  } catch (error) {
    console.error("Failed to compute/save full atom mastery:", error);
  }
}

/**
 * POST /api/diagnostic/profile
 * Saves diagnostic results and optional profiling data for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedStudentUser();
    if (authResult.unauthorizedResponse) {
      return authResult.unauthorizedResponse;
    }

    const userId = authResult.userId;
    const payload = await parseBody(request);
    if (payload.userId && payload.userId !== userId) {
      return forbiddenResponse();
    }

    const user = await findUser(userId);
    if (!user) {
      return notFoundResponse();
    }

    const resultsSnapshot = payload.diagnosticData?.results ?? null;
    await updateUserProfileSnapshot({
      userId,
      resultsSnapshot,
      profilingData: payload.profilingData,
    });

    const attemptResolution = await resolveAttemptId({
      userId,
      attemptId: payload.attemptId,
      diagnosticData: payload.diagnosticData,
    });
    if ("errorResponse" in attemptResolution) {
      return attemptResolution.errorResponse;
    }

    await saveAtomMastery({ userId, atomResults: payload.atomResults });
    await processProfileEmails({
      userId,
      userEmail: user.email,
      resultsSnapshot,
      profilingData: payload.profilingData,
      attemptId: attemptResolution.attemptId,
    });

    return NextResponse.json({
      success: true,
      userId,
      attemptId: attemptResolution.attemptId,
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
