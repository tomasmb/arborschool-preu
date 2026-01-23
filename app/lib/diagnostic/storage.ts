/**
 * Local Storage Helpers for Diagnostic Test
 *
 * Provides backup storage for test responses in case API calls fail.
 * Data is cleared after successful signup/completion.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_KEYS = {
  ATTEMPT: "arbor_diagnostic_attempt",
  RESPONSES: "arbor_diagnostic_responses",
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface StoredResponse {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  responseTimeSeconds: number;
  stage: 1 | 2;
  questionIndex: number;
  answeredAt: string;
}

// ============================================================================
// RESPONSE STORAGE
// ============================================================================

/**
 * Save a single response to localStorage backup.
 * Appends to existing responses array.
 */
export function saveResponseToLocalStorage(response: StoredResponse): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    const responses: StoredResponse[] = existing ? JSON.parse(existing) : [];
    responses.push(response);
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
