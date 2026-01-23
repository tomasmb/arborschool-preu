/**
 * Question Unlock Algorithm - Route Optimizer
 *
 * Builds optimal learning routes by:
 * 1. Grouping high-value atoms by axis
 * 2. Ordering atoms respecting prerequisite dependencies
 * 3. Calculating cumulative impact at each step
 */

import type {
  AtomWithPrereqs,
  QuestionWithAtoms,
  AtomMasteryState,
  AtomMarginalValue,
  LearningRoute,
  AtomInRoute,
  ScoringConfig,
} from "./types";
import { DEFAULT_SCORING_CONFIG } from "./types";
import { getMasteredAtomIds } from "./masteryAnalyzer";
import { simulateQuestionUnlocks } from "./unlockCalculator";
import { calculateImprovement } from "../paesScoreTable";
import {
  capImprovementToMax,
  estimateCorrectFromScore,
} from "../scoringConstants";

// ============================================================================
// AXIS CONFIGURATION
// ============================================================================

const AXIS_DISPLAY_NAMES: Record<string, string> = {
  algebra_y_funciones: "Álgebra y Funciones",
  numeros: "Números",
  geometria: "Geometría",
  probabilidad_y_estadistica: "Probabilidad y Estadística",
};

const AXIS_SHORT_CODES: Record<string, string> = {
  algebra_y_funciones: "ALG",
  numeros: "NUM",
  geometria: "GEO",
  probabilidad_y_estadistica: "PROB",
};

// ============================================================================
// TOPOLOGICAL SORTING
// ============================================================================

/**
 * Performs topological sort on atoms respecting prerequisites.
 * Returns atoms in learning order (prerequisites first).
 */
export function topologicalSortAtoms(
  atomIds: string[],
  allAtoms: Map<string, AtomWithPrereqs>,
  masteredAtoms: Set<string>
): string[] {
  const atomSet = new Set(atomIds);
  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(atomId: string): void {
    if (visited.has(atomId)) return;
    if (visiting.has(atomId)) {
      // Cycle detected - just add it and continue
      console.warn(`Cycle detected in prerequisites at atom ${atomId}`);
      return;
    }

    visiting.add(atomId);

    const atom = allAtoms.get(atomId);
    if (atom) {
      // Visit prerequisites first (if they're in our set and not mastered)
      for (const prereqId of atom.prerequisiteIds) {
        if (atomSet.has(prereqId) && !masteredAtoms.has(prereqId)) {
          visit(prereqId);
        }
      }
    }

    visiting.delete(atomId);
    visited.add(atomId);

    if (atomSet.has(atomId)) {
      result.push(atomId);
    }
  }

  for (const atomId of atomIds) {
    if (!visited.has(atomId)) {
      visit(atomId);
    }
  }

  return result;
}

// ============================================================================
// ROUTE BUILDING
// ============================================================================

/**
 * Builds a learning route for a specific axis.
 * Selects high-value atoms and orders them optimally.
 */
export function buildAxisRoute(
  axis: string,
  marginalValues: AtomMarginalValue[],
  allAtoms: Map<string, AtomWithPrereqs>,
  questions: Map<string, QuestionWithAtoms>,
  masteryMap: Map<string, AtomMasteryState>,
  config: ScoringConfig,
  maxAtoms: number = 10
): LearningRoute | null {
  const masteredAtoms = getMasteredAtomIds(masteryMap);

  // Filter to atoms in this axis with positive scores
  const axisAtoms = marginalValues.filter(
    (v) => v.axis === axis && v.unlockScore > 0
  );

  if (axisAtoms.length === 0) {
    return null;
  }

  // Collect atoms to include: top scorers + their prerequisites
  const atomsToInclude = new Set<string>();
  const sortedByEfficiency = [...axisAtoms].sort(
    (a, b) => b.efficiency - a.efficiency
  );

  for (const atomValue of sortedByEfficiency) {
    if (atomsToInclude.size >= maxAtoms) break;

    // Add the atom and its prerequisites
    atomsToInclude.add(atomValue.atomId);
    for (const prereqId of atomValue.prerequisitesNeeded) {
      atomsToInclude.add(prereqId);
    }
  }

  // Sort topologically
  const orderedAtoms = topologicalSortAtoms(
    [...atomsToInclude],
    allAtoms,
    masteredAtoms
  );

  // Build route with cumulative stats
  const atomsInRoute: AtomInRoute[] = [];
  let simulatedMastery = new Set(masteredAtoms);
  let cumulativeUnlocked = countCurrentlyUnlocked(questions, masteredAtoms);

  for (let i = 0; i < orderedAtoms.length; i++) {
    const atomId = orderedAtoms[i];
    const atom = allAtoms.get(atomId);

    if (!atom) continue;

    // Calculate questions unlocked at this step
    const { totalUnlockedAfter } = simulateQuestionUnlocks(
      [atomId],
      questions,
      simulatedMastery
    );

    const questionsUnlockedHere = totalUnlockedAfter - cumulativeUnlocked;
    cumulativeUnlocked = totalUnlockedAfter;
    simulatedMastery = new Set([...simulatedMastery, atomId]);

    // Check if this atom is a prerequisite for others in the route
    const isPrerequisite = orderedAtoms.slice(i + 1).some((laterAtomId) => {
      const laterAtom = allAtoms.get(laterAtomId);
      return laterAtom?.prerequisiteIds.includes(atomId);
    });

    atomsInRoute.push({
      atomId,
      title: atom.title,
      position: i + 1,
      questionsUnlockedHere,
      cumulativeQuestionsUnlocked: cumulativeUnlocked,
      isPrerequisite,
    });
  }

  // Calculate totals
  const initialUnlocked = countCurrentlyUnlocked(questions, masteredAtoms);
  const finalUnlocked = cumulativeUnlocked;
  const totalQuestionsUnlocked = finalUnlocked - initialUnlocked;

  // Calculate per-test values (questions are spread across multiple tests)
  const additionalPerTest = Math.round(
    totalQuestionsUnlocked / config.numOfficialTests
  );

  // Use diagnostic score as baseline (more accurate than unlocked questions)
  // Default to 460 (~20 correct) if not provided
  const currentScore = config.currentPaesScore ?? 460;
  const currentCorrect = estimateCorrectFromScore(currentScore);

  // Use actual PAES table for accurate point estimation
  const improvement = calculateImprovement(currentCorrect, additionalPerTest);

  // Cap improvement to ensure we never promise exceeding 1000 points
  const estimatedPointsGain = capImprovementToMax(
    currentScore,
    improvement.improvement
  );

  return {
    axis: AXIS_SHORT_CODES[axis] || axis,
    axisDisplayName: AXIS_DISPLAY_NAMES[axis] || axis,
    atoms: atomsInRoute,
    totalQuestionsUnlocked,
    estimatedPointsGain,
    estimatedMinutes: atomsInRoute.length * config.minutesPerAtom,
  };
}

/**
 * Counts questions currently unlocked.
 */
function countCurrentlyUnlocked(
  questions: Map<string, QuestionWithAtoms>,
  masteredAtoms: Set<string>
): number {
  let count = 0;

  for (const question of questions.values()) {
    if (question.primaryAtomIds.length === 0) continue;
    if (question.primaryAtomIds.every((id) => masteredAtoms.has(id))) {
      count++;
    }
  }

  return count;
}

/**
 * Builds learning routes for all axes.
 * Returns routes sorted by impact (questions unlocked).
 */
export function buildAllRoutes(
  marginalValues: AtomMarginalValue[],
  allAtoms: Map<string, AtomWithPrereqs>,
  questions: Map<string, QuestionWithAtoms>,
  masteryMap: Map<string, AtomMasteryState>,
  config: ScoringConfig = { ...DEFAULT_SCORING_CONFIG }
): LearningRoute[] {
  const axes = [...new Set(marginalValues.map((v) => v.axis))];
  const routes: LearningRoute[] = [];

  for (const axis of axes) {
    const route = buildAxisRoute(
      axis,
      marginalValues,
      allAtoms,
      questions,
      masteryMap,
      config
    );

    if (route && route.totalQuestionsUnlocked > 0) {
      routes.push(route);
    }
  }

  // Sort by total questions unlocked (descending)
  routes.sort((a, b) => b.totalQuestionsUnlocked - a.totalQuestionsUnlocked);

  return routes;
}

// ============================================================================
// QUICK WINS FINDER
// ============================================================================

/**
 * Finds "quick win" atoms that immediately unlock questions with no prerequisites.
 * These are the lowest-hanging fruit.
 */
export function findQuickWins(
  marginalValues: AtomMarginalValue[],
  limit: number = 5
): AtomMarginalValue[] {
  return marginalValues
    .filter(
      (v) => v.immediateUnlocks.length > 0 && v.prerequisitesNeeded.length === 0
    )
    .sort((a, b) => b.immediateUnlocks.length - a.immediateUnlocks.length)
    .slice(0, limit);
}

/**
 * Finds atoms that would unlock the most questions with minimal effort.
 * Considers both immediate unlocks and atom cost.
 */
export function findHighImpactAtoms(
  marginalValues: AtomMarginalValue[],
  limit: number = 10
): AtomMarginalValue[] {
  return marginalValues
    .filter((v) => v.unlockScore > 0)
    .sort((a, b) => {
      // Primary sort: efficiency
      if (b.efficiency !== a.efficiency) {
        return b.efficiency - a.efficiency;
      }
      // Secondary sort: raw score (for ties)
      return b.unlockScore - a.unlockScore;
    })
    .slice(0, limit);
}
