/**
 * Diagnostic API client functions.
 *
 * Pure fetch wrappers — no React state or side effects.
 * Each function calls one API endpoint and returns typed results.
 */

import {
  saveResponseToLocalStorage,
  isLocalAttempt,
  getStoredResponses,
  reconstructFullResponses,
  getActualRouteFromStorage,
  getResponseCounts,
} from "@/lib/diagnostic/storage";
import {
  calculateDiagnosticResults,
  computeAtomMastery,
} from "@/lib/diagnostic/resultsCalculator";
import { getPerformanceTier } from "@/lib/config/tiers";
import { type Route } from "@/lib/diagnostic/config";
import { type LearningRoutesResponse } from "../hooks/useLearningRoutes";

// ============================================================================
// TYPES
// ============================================================================

interface RegisterResult {
  success: boolean;
  userId?: string;
  error?: string;
}

interface StartResult {
  success: boolean;
  attemptId?: string;
  error?: string;
}

/** Parameters for saving a question response (localStorage + API) */
export interface SaveResponseParams {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  stage: 1 | 2;
  questionIndex: number;
  route: Route | null;
  atoms: { atomId: string; relevance: "primary" | "secondary" }[];
  answeredAfterTimeUp: boolean;
  alternateQuestionId?: string;
  attemptId: string | null;
}

/** Profile payload building inputs */
export interface ProfileContext {
  userId: string | null;
  attemptId: string | null;
  route: Route;
  topRouteInfo?: {
    name: string;
    questionsUnlocked: number;
    pointsGain: number;
    studyHours: number;
  } | null;
  profilingData?: unknown;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/** Register a new user via the mini-form */
export async function registerUser(
  email: string,
  userType: string,
  curso: string
): Promise<RegisterResult> {
  const res = await fetch("/api/diagnostic/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, userType, curso }),
  });
  return res.json();
}

/** Start a new test attempt (with 10s timeout to avoid stale DB hangs) */
export async function startTestAttempt(
  userId: string | null
): Promise<StartResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const res = await fetch("/api/diagnostic/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return res.json();
}

/** Save a single question response to the API */
export async function saveResponseToApi(params: {
  attemptId: string | null;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  stage: number;
  questionIndex: number;
}): Promise<void> {
  await fetch("/api/diagnostic/response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/** Mark a test attempt as complete */
export async function completeTestAttempt(params: {
  attemptId: string | null;
  totalQuestions: number;
  correctAnswers: number;
  stage1Score: number;
  stage2Difficulty: string;
}): Promise<void> {
  await fetch("/api/diagnostic/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/** Fetch personalized learning routes based on atom mastery */
export async function fetchLearningRoutesApi(
  atomResults: { atomId: string; mastered: boolean }[],
  diagnosticScore: number
): Promise<LearningRoutesResponse | null> {
  const response = await fetch("/api/diagnostic/learning-routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ atomResults, diagnosticScore }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }
  return null;
}

/** Save user profile and diagnostic results */
async function saveProfileFetch(
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch("/api/diagnostic/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

// ============================================================================
// RESULTS HELPERS
// ============================================================================

/**
 * Compute scored results and midpoint PAES score from localStorage.
 * Shared by both the normal flow and the time-up flow.
 */
export function computeScoredResults(route: Route) {
  const actualRoute = getActualRouteFromStorage(route);
  const scoredResponses = reconstructFullResponses({ excludeOvertime: true });
  const calc = calculateDiagnosticResults(scoredResponses, actualRoute);
  const midScore = Math.round((calc.paesMin + calc.paesMax) / 2);
  return { calc, midScore, actualRoute };
}

// ============================================================================
// COMPOSITE OPERATIONS
// ============================================================================

/**
 * Saves a question response to both localStorage (always) and the API
 * (if non-local attempt). Fire-and-forget for API errors.
 */
export async function saveQuestionResponse(
  params: SaveResponseParams
): Promise<void> {
  // Always save to localStorage as backup
  saveResponseToLocalStorage({
    questionId: params.questionId,
    selectedAnswer: params.selectedAnswer,
    isCorrect: params.isCorrect,
    responseTimeSeconds: params.responseTimeSeconds,
    stage: params.stage,
    questionIndex: params.questionIndex,
    route: params.route,
    answeredAt: new Date().toISOString(),
    atoms: params.atoms,
    answeredAfterTimeUp: params.answeredAfterTimeUp,
    alternateQuestionId: params.alternateQuestionId,
  });

  // Save to API if non-local attempt
  if (!isLocalAttempt(params.attemptId)) {
    try {
      await saveResponseToApi({
        attemptId: params.attemptId,
        questionId: params.questionId,
        selectedAnswer: params.selectedAnswer,
        isCorrect: params.isCorrect,
        responseTime: params.responseTimeSeconds,
        stage: params.stage,
        questionIndex: params.questionIndex,
      });
    } catch (error) {
      console.error("Failed to save response to API:", error);
    }
  }
}

/**
 * Builds the profile payload, saves it via API, and returns the cache
 * data needed for the results screen (since localStorage gets cleared).
 */
export async function buildAndSaveProfile(ctx: ProfileContext) {
  const storedResponses = getStoredResponses();
  const actualRoute = getActualRouteFromStorage(ctx.route);
  const allResponses = reconstructFullResponses();
  const atomResults = computeAtomMastery(allResponses);
  const scoredResponses = reconstructFullResponses({ excludeOvertime: true });
  const isLocal = isLocalAttempt(ctx.attemptId);
  const calc = calculateDiagnosticResults(scoredResponses, actualRoute);
  const counts = getResponseCounts();

  const data = await saveProfileFetch({
    userId: ctx.userId,
    attemptId: isLocal ? null : ctx.attemptId,
    profilingData: ctx.profilingData,
    atomResults,
    diagnosticData: {
      responses: isLocal ? storedResponses : [],
      results: {
        paesMin: calc.paesMin,
        paesMax: calc.paesMax,
        level: calc.level,
        route: actualRoute,
        totalCorrect: counts.scoredCorrect,
        performanceTier: getPerformanceTier(counts.scoredCorrect),
        topRoute: ctx.topRouteInfo ?? undefined,
      },
    },
  });

  if (!data.success) throw new Error(data.error || "Error al guardar perfil");

  return {
    calculatedResults: calc,
    atomResults,
    scoredCorrect: counts.scoredCorrect,
    actualRoute,
  };
}
