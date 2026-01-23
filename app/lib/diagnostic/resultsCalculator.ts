/**
 * Results Calculator for Diagnostic Test
 *
 * Consolidates results calculation logic used when test completes
 * or when time runs out.
 */

import {
  calculatePAESScore,
  calculateAxisPerformance,
  calculateSkillPerformance,
  type Route,
  type Axis,
  type Skill,
  type MSTQuestion,
} from "./config";
import { type QuestionAtom } from "./qtiParser";

// ============================================================================
// TYPES
// ============================================================================

export interface DiagnosticResponse {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
  responseTime: number;
  atoms: QuestionAtom[];
}

export interface DiagnosticResults {
  paesMin: number;
  paesMax: number;
  level: string;
  axisPerformance: Record<Axis, { correct: number; total: number; percentage: number }>;
  skillPerformance: Record<Skill, { correct: number; total: number; percentage: number }>;
}

// ============================================================================
// RESULTS CALCULATION
// ============================================================================

/**
 * Calculate final diagnostic results from all responses.
 *
 * @param responses - All question responses from both stages
 * @param route - The determined route (A, B, or C)
 * @returns Complete diagnostic results with PAES score and performance metrics
 */
export function calculateDiagnosticResults(
  responses: DiagnosticResponse[],
  route: Route
): DiagnosticResults {
  // Calculate PAES score
  const responseData = responses.map((r) => ({
    correct: r.isCorrect,
    difficulty: r.question.difficulty,
  }));
  const paesResult = calculatePAESScore(route, responseData);

  // Calculate axis performance
  const axisData = responses.map((r) => ({
    axis: r.question.axis,
    correct: r.isCorrect,
  }));
  const axisPerformance = calculateAxisPerformance(axisData);

  // Calculate skill performance
  const skillData = responses.map((r) => ({
    skill: r.question.skill,
    correct: r.isCorrect,
  }));
  const skillPerformance = calculateSkillPerformance(skillData);

  return {
    paesMin: paesResult.min,
    paesMax: paesResult.max,
    level: paesResult.level,
    axisPerformance,
    skillPerformance,
  };
}

// ============================================================================
// ATOM MASTERY CALCULATION
// ============================================================================

export interface AtomResult {
  atomId: string;
  mastered: boolean;
}

/**
 * Compute atom mastery results from all responses.
 *
 * Primary atoms are marked as mastered only if the question was answered correctly.
 * Uses conservative approach: an atom must be answered correctly to be mastered.
 *
 * @param responses - All question responses
 * @returns Array of atom mastery results
 */
export function computeAtomMastery(responses: DiagnosticResponse[]): AtomResult[] {
  const atomMap = new Map<string, boolean>();

  responses.forEach((response) => {
    // Safety check: atoms may be undefined if API didn't return them
    const atoms = response.atoms || [];

    atoms
      .filter((atom) => atom.relevance === "primary")
      .forEach((atom) => {
        // Only mark as mastered if correct; don't overwrite mastered with not mastered
        const current = atomMap.get(atom.atomId);
        if (current === undefined) {
          atomMap.set(atom.atomId, response.isCorrect);
        }
        // If already marked, keep existing value (conservative approach)
      });
  });

  return Array.from(atomMap.entries()).map(([atomId, mastered]) => ({
    atomId,
    mastered,
  }));
}
