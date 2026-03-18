/**
 * Shared constants and pure utilities for student simulator / goals.
 * This file must remain free of server-only imports so it can be
 * safely consumed by both server code and client components.
 */

export const ELECTIVO_TEST_CODE = "ELECTIVO";

export const ELECTIVO_SUB_TESTS = ["CIENCIAS", "HISTORIA"] as const;

export const SCORE_MIN = 100;
export const SCORE_MAX = 1000;

export const MAX_CAREER_INTERESTS = 5;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeTestCode(testCode: string): string {
  return testCode.trim().toUpperCase();
}

export function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= SCORE_MIN && score <= SCORE_MAX;
}

/**
 * Resolves the ELECTIVO score from sub-tests (CIENCIAS, HISTORIA),
 * taking the best available.
 */
export function resolveElectivoFromMap(
  scores: Map<string, number>
): number | null {
  let best: number | null = null;
  for (const sub of ELECTIVO_SUB_TESTS) {
    const score = scores.get(sub);
    if (score !== undefined && (best === null || score > best)) {
      best = score;
    }
  }
  return best;
}

/** Strips non-numeric chars from a raw input string. */
export function filterNumericInput(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}
