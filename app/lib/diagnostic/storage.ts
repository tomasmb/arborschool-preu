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
 * Returns empty array if no data or on error.
 */
export function getStoredResponses(): StoredResponse[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
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
  try {
    return localStorage.getItem(STORAGE_KEYS.ATTEMPT);
  } catch {
    return null;
  }
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
  | "welcome"
  | "question"
  | "transition"
  | "results"
  | "signup"
  | "thankyou"
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
 */
export function getStoredSessionState(): SessionState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!stored) return null;

    const session: SessionState = JSON.parse(stored);

    // Session expires after 1 hour of inactivity
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - session.savedAt > ONE_HOUR) {
      clearSessionState();
      return null;
    }

    return session;
  } catch {
    return null;
  }
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
}

/**
 * Reconstruct responses for review from localStorage.
 * Maps stored responses back to MSTQuestion objects using the config.
 * Uses stored route from each response if available, falls back to passed route.
 */
export function getResponsesForReview(
  fallbackRoute: Route | null
): ResponseForReview[] {
  const storedResponses = getStoredResponses();
  if (storedResponses.length === 0) return [];

  const responses: ResponseForReview[] = [];

  for (const stored of storedResponses) {
    let question: MSTQuestion | undefined;

    if (stored.stage === 1) {
      // Stage 1 questions come from R1
      question = MST_QUESTIONS.R1[stored.questionIndex];
    } else if (stored.stage === 2) {
      // Use stored route if available, otherwise fall back to passed route
      const routeForQuestion = stored.route || fallbackRoute;
      if (routeForQuestion) {
        const stage2Questions = getStage2Questions(routeForQuestion);
        question = stage2Questions[stored.questionIndex];
      }
    }

    if (question) {
      responses.push({
        question,
        selectedAnswer: stored.selectedAnswer,
        isCorrect: stored.isCorrect,
      });
    }
  }

  return responses;
}

/**
 * Get stored responses for a specific stage, reconstructed with MSTQuestion.
 * Used to restore r1Responses/stage2Responses after page refresh.
 * Uses stored route from each response if available, falls back to passed route.
 */
export function getStoredResponsesForStage(
  stage: 1 | 2,
  fallbackRoute: Route | null
): ResponseForReview[] {
  const storedResponses = getStoredResponses();
  const stageResponses = storedResponses.filter((r) => r.stage === stage);

  // Sort by questionIndex to maintain order
  stageResponses.sort((a, b) => a.questionIndex - b.questionIndex);

  const responses: ResponseForReview[] = [];

  for (const stored of stageResponses) {
    let question: MSTQuestion | undefined;

    if (stage === 1) {
      question = MST_QUESTIONS.R1[stored.questionIndex];
    } else if (stage === 2) {
      // Use stored route if available, otherwise fall back to passed route
      const routeForQuestion = stored.route || fallbackRoute;
      if (routeForQuestion) {
        const stage2Questions = getStage2Questions(routeForQuestion);
        question = stage2Questions[stored.questionIndex];
      }
    }

    if (question) {
      responses.push({
        question,
        selectedAnswer: stored.selectedAnswer,
        isCorrect: stored.isCorrect,
      });
    }
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

/**
 * Reconstructs full DiagnosticResponse objects from localStorage.
 * Used for results calculation, signup, and time-up scenarios.
 *
 * @param fallbackRoute - Route to use if not stored in response (session route)
 * @returns Array of reconstructed responses with MSTQuestion objects
 */
export function reconstructFullResponses(
  fallbackRoute: Route | null
): ReconstructedResponse[] {
  const storedResponses = getStoredResponses();
  if (storedResponses.length === 0) return [];

  const responses: ReconstructedResponse[] = [];

  for (const stored of storedResponses) {
    let question: MSTQuestion | undefined;

    if (stored.stage === 1) {
      question = MST_QUESTIONS.R1[stored.questionIndex];
    } else if (stored.stage === 2) {
      // Use stored route if available, otherwise fall back to passed route
      const routeForQuestion = stored.route || fallbackRoute;
      if (routeForQuestion) {
        const stage2Questions = getStage2Questions(routeForQuestion);
        question = stage2Questions[stored.questionIndex];
      }
    }

    if (question) {
      responses.push({
        question,
        selectedAnswer: stored.selectedAnswer,
        isCorrect: stored.isCorrect,
        responseTime: stored.responseTimeSeconds,
        atoms: stored.atoms || [],
      });
    }
  }

  return responses;
}

/**
 * Gets the actual route used in stage 2 from stored responses.
 * Falls back to the provided route if no stage 2 responses exist.
 */
export function getActualRouteFromStorage(fallbackRoute: Route): Route {
  const storedResponses = getStoredResponses();
  const stage2Response = storedResponses.find((r) => r.stage === 2);
  return stage2Response?.route || fallbackRoute;
}
