/**
 * Local Storage Helpers for Diagnostic Test
 *
 * Provides backup storage for test responses in case API calls fail.
 * Also persists session state to survive page refreshes.
 * Data is cleared after successful signup/completion.
 */

import {
  type Route,
  type MSTQuestion,
  MST_QUESTIONS,
  getStage2Questions,
} from "./config";

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_KEYS = {
  ATTEMPT: "arbor_diagnostic_attempt",
  RESPONSES: "arbor_diagnostic_responses",
  SESSION: "arbor_diagnostic_session",
} as const;

// Total test time in seconds (30 minutes)
const TOTAL_TIME_SECONDS = 30 * 60;

// ============================================================================
// TYPES
// ============================================================================

/** Stored atom data (minimal for localStorage efficiency) */
export interface StoredAtom {
  atomId: string;
  relevance: "primary" | "secondary";
}

export interface StoredResponse {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  responseTimeSeconds: number;
  stage: 1 | 2;
  questionIndex: number;
  /** Route at time of answering (for stage 2 question reconstruction) */
  route?: Route | null;
  answeredAt: string;
  /** Atoms associated with this question (needed for mastery calculation) */
  atoms?: StoredAtom[];
  /** Whether this response was submitted after the timer expired (for diagnostic only) */
  answeredAfterTimeUp?: boolean;
  /** The actual alternate question ID shown (for accurate review) */
  alternateQuestionId?: string;
}

// ============================================================================
// RESPONSE STORAGE
// ============================================================================

/**
 * Save a single response to localStorage backup.
 * Updates existing response for same stage+questionIndex, or appends if new.
 */
export function saveResponseToLocalStorage(response: StoredResponse): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    const responses: StoredResponse[] = existing ? JSON.parse(existing) : [];

    // Check if response for this stage+questionIndex already exists
    const existingIndex = responses.findIndex(
      (r) =>
        r.stage === response.stage && r.questionIndex === response.questionIndex
    );

    if (existingIndex >= 0) {
      // Update existing response (user may have refreshed and re-answered)
      responses[existingIndex] = response;
    } else {
      // Add new response
      responses.push(response);
    }

    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  } catch (error) {
    console.error("Failed to save response to localStorage:", error);
  }
}

/**
 * Retrieve all stored responses from localStorage.
 * Returns empty array if no data. Throws on parse errors.
 */
export function getStoredResponses(): StoredResponse[] {
  const stored = localStorage.getItem(STORAGE_KEYS.RESPONSES);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse stored responses:", error);
    throw new Error("Corrupted response data in localStorage");
  }
}

/**
 * Clear all diagnostic data from localStorage.
 * Called after successful signup to clean up backup data.
 */
export function clearStoredResponses(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RESPONSES);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPT);
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
}

// ============================================================================
// ATTEMPT ID STORAGE
// ============================================================================

/**
 * Save attempt ID to localStorage for persistence across page refreshes.
 */
export function saveAttemptId(attemptId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTEMPT, attemptId);
  } catch (error) {
    console.error("Failed to save attempt ID to localStorage:", error);
  }
}

/**
 * Retrieve stored attempt ID from localStorage.
 */
export function getStoredAttemptId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ATTEMPT);
}

/**
 * Check if an attempt ID is a local fallback (not synced to server).
 */
export function isLocalAttempt(attemptId: string | null): boolean {
  return !attemptId || attemptId.startsWith("local-");
}

/**
 * Generate a local fallback attempt ID for offline mode.
 */
export function generateLocalAttemptId(): string {
  return `local-${Date.now()}`;
}

// ============================================================================
// SESSION STATE STORAGE
// ============================================================================

type Screen =
  | "mini-form"
  | "question"
  | "transition"
  | "partial-results"
  | "profiling"
  | "confirm-skip"
  | "results"
  | "thank-you"
  | "maintenance";

/** Results summary for storage (full DiagnosticResults is too large) */
export interface StoredResults {
  paesMin: number;
  paesMax: number;
  level: string;
  axisPerformance: Record<
    string,
    { correct: number; total: number; percentage: number }
  >;
}

export interface SessionState {
  screen: Screen;
  stage: 1 | 2;
  questionIndex: number;
  route: Route | null;
  /** Number of correct answers in stage 1 (for transition screen) */
  r1Correct: number;
  /** Total correct answers across both stages (for results screen) */
  totalCorrect: number;
  /** Timestamp when timer started (for calculating remaining time) */
  timerStartedAt: number;
  /** Timestamp when timer expired (null if still running) */
  timeExpiredAt: number | null;
  /** Results data if test is completed */
  results: StoredResults | null;
  /** Timestamp when session was saved */
  savedAt: number;
}

/**
 * Save session state to localStorage.
 * Called on significant state changes.
 */
export function saveSessionState(state: Omit<SessionState, "savedAt">): void {
  try {
    const sessionData: SessionState = {
      ...state,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
  } catch (error) {
    console.error("Failed to save session state:", error);
  }
}

/**
 * Retrieve stored session state from localStorage.
 * Returns null if no session or session is too old (>1 hour).
 * Throws on parse errors to surface corrupted data.
 */
export function getStoredSessionState(): SessionState | null {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!stored) return null;

  let session: SessionState;
  try {
    session = JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse session state:", error);
    throw new Error("Corrupted session data in localStorage");
  }

  // Session expires after 1 hour of inactivity
  const ONE_HOUR = 60 * 60 * 1000;
  if (Date.now() - session.savedAt > ONE_HOUR) {
    clearSessionState();
    return null;
  }

  return session;
}

/**
 * Calculate remaining time based on when timer started.
 * Returns 0 if time has expired.
 */
export function calculateRemainingTime(timerStartedAt: number): number {
  const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
  const remaining = TOTAL_TIME_SECONDS - elapsed;
  return Math.max(0, remaining);
}

/**
 * Clear session state from localStorage.
 * Called when starting a new test or after signup.
 */
export function clearSessionState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (error) {
    console.error("Failed to clear session state:", error);
  }
}

/**
 * Clear all diagnostic data (session, responses, attempt).
 * Called when user wants to start completely fresh.
 */
export function clearAllDiagnosticData(): void {
  clearStoredResponses();
  clearSessionState();
}

// ============================================================================
// RESPONSE RECONSTRUCTION
// ============================================================================

/** Minimal response data needed for review drawer */
export interface ResponseForReview {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
  /** The actual alternate question ID shown (for accurate review) */
  alternateQuestionId?: string;
}

/**
 * Reconstruct responses for review from localStorage.
 * Maps stored responses back to MSTQuestion objects using the config.
 * Requires stored route for stage 2 responses.
 */
export function getResponsesForReview(): ResponseForReview[] {
  const storedResponses = getStoredResponses();
  if (storedResponses.length === 0) return [];

  const responses: ResponseForReview[] = [];

  for (const stored of storedResponses) {
    let question: MSTQuestion | undefined;

    if (stored.stage === 1) {
      // Stage 1 questions come from R1
      question = MST_QUESTIONS.R1[stored.questionIndex];
    } else if (stored.stage === 2) {
      // Require route for stage 2 - no fallbacks
      const routeForQuestion = stored.route;
      if (!routeForQuestion) {
        throw new Error(
          `Stage 2 response at index ${stored.questionIndex} has no route stored`
        );
      }
      const stage2Questions = getStage2Questions(routeForQuestion);
      question = stage2Questions[stored.questionIndex];
    }

    if (!question) {
      throw new Error(
        `Could not find question for stage ${stored.stage}, index ${stored.questionIndex}`
      );
    }

    // Normalize "skip" back to null so review components detect skipped questions
    const normalizedAnswer =
      stored.selectedAnswer === "skip" ? null : stored.selectedAnswer;

    responses.push({
      question,
      selectedAnswer: normalizedAnswer,
      isCorrect: stored.isCorrect,
      alternateQuestionId: stored.alternateQuestionId,
    });
  }

  return responses;
}

// ============================================================================
// FULL RESPONSE RECONSTRUCTION
// ============================================================================

/** Full response data needed for results calculation */
export interface ReconstructedResponse {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
  responseTime: number;
  atoms: StoredAtom[];
}

/** Options for reconstructing responses */
export interface ReconstructOptions {
  /** If true, exclude responses answered after time expired (for scoring) */
  excludeOvertime?: boolean;
}

/**
 * Reconstructs full DiagnosticResponse objects from localStorage.
 * Used for results calculation, signup, and time-up scenarios.
 * Requires stored route for stage 2 responses.
 *
 * @param options - Options for filtering responses
 * @returns Array of reconstructed responses with MSTQuestion objects
 */
export function reconstructFullResponses(
  options: ReconstructOptions = {}
): ReconstructedResponse[] {
  let storedResponses = getStoredResponses();
  if (storedResponses.length === 0) return [];

  // Filter out overtime responses if requested (for scoring)
  if (options.excludeOvertime) {
    storedResponses = storedResponses.filter((r) => !r.answeredAfterTimeUp);
  }

  const responses: ReconstructedResponse[] = [];

  for (const stored of storedResponses) {
    let question: MSTQuestion | undefined;

    if (stored.stage === 1) {
      question = MST_QUESTIONS.R1[stored.questionIndex];
    } else if (stored.stage === 2) {
      // Require route for stage 2 - no fallbacks
      const routeForQuestion = stored.route;
      if (!routeForQuestion) {
        throw new Error(
          `Stage 2 response at index ${stored.questionIndex} has no route stored`
        );
      }
      const stage2Questions = getStage2Questions(routeForQuestion);
      question = stage2Questions[stored.questionIndex];
    }

    if (!question) {
      throw new Error(
        `Could not find question for stage ${stored.stage}, index ${stored.questionIndex}`
      );
    }

    if (!stored.atoms) {
      throw new Error(
        `Response for question ${stored.questionId} has no atoms stored`
      );
    }

    // Normalize "skip" back to null for consistent skip detection
    const normalizedAnswer =
      stored.selectedAnswer === "skip" ? null : stored.selectedAnswer;

    responses.push({
      question,
      selectedAnswer: normalizedAnswer,
      isCorrect: stored.isCorrect,
      responseTime: stored.responseTimeSeconds,
      atoms: stored.atoms,
    });
  }

  return responses;
}

/**
 * Gets the actual route used in stage 2 from stored responses.
 * Requires a stage 2 response with route to exist.
 */
export function getActualRouteFromStorage(expectedRoute: Route): Route {
  const storedResponses = getStoredResponses();
  const stage2Response = storedResponses.find((r) => r.stage === 2);

  if (stage2Response?.route) {
    return stage2Response.route;
  }

  // If no stage 2 responses yet, use expected route (stage 2 hasn't started)
  if (!stage2Response) {
    return expectedRoute;
  }

  // Stage 2 response exists but has no route - this is a bug
  throw new Error("Stage 2 response found but has no route stored");
}

// ============================================================================
// SCORING HELPERS
// ============================================================================

/** Response counts for scoring vs diagnostic */
export interface ResponseCounts {
  /** Responses answered before time expired (count for scoring) */
  scoredCount: number;
  /** Correct answers before time expired */
  scoredCorrect: number;
  /** Responses answered after time expired (diagnostic only) */
  overtimeCount: number;
  /** Total responses (scored + overtime) */
  totalAnswered: number;
}

/**
 * Get counts of scored vs overtime responses.
 * Used to display "X/16 correctas" with proper breakdown.
 */
export function getResponseCounts(): ResponseCounts {
  const storedResponses = getStoredResponses();

  const scoredResponses = storedResponses.filter((r) => !r.answeredAfterTimeUp);
  const overtimeResponses = storedResponses.filter(
    (r) => r.answeredAfterTimeUp
  );

  return {
    scoredCount: scoredResponses.length,
    scoredCorrect: scoredResponses.filter((r) => r.isCorrect).length,
    overtimeCount: overtimeResponses.length,
    totalAnswered: storedResponses.length,
  };
}
