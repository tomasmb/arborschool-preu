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
  axisPerformance: Record<
    Axis,
    { correct: number; total: number; percentage: number }
  >;
  skillPerformance: Record<
    Skill,
    { correct: number; total: number; percentage: number }
  >;
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
 * Per methodology (section 2.1 & D.2), mastery includes BOTH primary AND
 * secondary atoms when a question is answered correctly. Transitivity is
 * then applied to infer mastery of prerequisites.
 *
 * - Primary atoms: main concepts tested
 * - Secondary atoms: supporting concepts used
 * - Prerequisites: inferred via transitivity (handled by atomMastery module)
 *
 * Uses conservative approach: an atom must be tested on a correctly answered
 * question to be marked as directly mastered.
 *
 * @param responses - All question responses
 * @returns Array of atom mastery results (to be processed with transitivity)
 * @see docs/diagnostic-score-methodology.md section D.2
 */
export function computeAtomMastery(
  responses: DiagnosticResponse[]
): AtomResult[] {
  const atomMap = new Map<string, boolean>();

  responses.forEach((response) => {
    // Safety check: atoms may be undefined if API didn't return them
    const atoms = response.atoms || [];

    // Include BOTH primary AND secondary atoms per methodology
    // Transitivity is applied downstream by the atomMastery module
    atoms.forEach((atom) => {
      const current = atomMap.get(atom.atomId);

      if (current === undefined) {
        // First time seeing this atom - set its mastery status
        atomMap.set(atom.atomId, response.isCorrect);
      } else if (response.isCorrect && !current) {
        // Upgrade to mastered if we see it on a correct answer
        // (different question testing same atom correctly)
        atomMap.set(atom.atomId, true);
      }
      // If already mastered, keep it mastered (conservative approach)
    });
  });

  return Array.from(atomMap.entries()).map(([atomId, mastered]) => ({
    atomId,
    mastered,
  }));
}
