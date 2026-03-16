/**
 * Score History & Projection — query historical scores, build projection
 * metadata for client-side rendering.
 *
 * The projection uses a simulation-based model derived from the actual
 * atom-question unlock graph, the student's real learning route order, and
 * system-derived overhead constants. No guessed constants.
 *
 * Architecture:
 *   Server → builds unlock curve + metadata (one API call on page load)
 *   Client → walks curve at slider speed (instant, no API calls)
 */

import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { testAttempts, tests } from "@/db/schema";
import {
  estimateCorrectFromScore,
  PAES_TOTAL_QUESTIONS,
} from "@/lib/diagnostic/paesScoreTable";
import {
  EFFECTIVE_MINUTES_PER_ATOM,
  NUM_OFFICIAL_TESTS,
} from "@/lib/diagnostic/scoringConstants";
import {
  loadAllAtoms,
  loadOfficialQuestionsWithAtoms,
} from "@/lib/diagnostic/questionUnlock/dataLoader";
import {
  buildMasteryState,
  getMasteredAtomIds,
  analyzeAllQuestions,
} from "@/lib/diagnostic/questionUnlock/masteryAnalyzer";
import {
  calculateAllMarginalValues,
  simulateQuestionUnlocks,
} from "@/lib/diagnostic/questionUnlock/unlockCalculator";
import type {
  AtomWithPrereqs,
  AtomMasteryState,
} from "@/lib/diagnostic/questionUnlock/types";
import { getUserDiagnosticSnapshot, getMasteryRows } from "./userQueries";

// ============================================================================
// TYPES
// ============================================================================

export type ScoreDataPoint = {
  date: string;
  type: "short_diagnostic" | "full_test";
  paesScoreMin: number;
  paesScoreMax: number;
  paesScoreMid: number;
  correctAnswers: number | null;
  totalQuestions: number | null;
  testName: string | null;
};

/** One step on the unlock curve: after mastering N atoms, M questions unlocked */
export type UnlockCurveEntry = {
  atomsMastered: number;
  questionsUnlocked: number;
};

/**
 * All data the client needs to compute projections locally.
 * Sent once on page load; slider changes need no API call.
 */
export type ProjectionMetadata = {
  unlockCurve: UnlockCurveEntry[];
  accUnlocked: number;
  accLocked: number;
  effectiveMinPerAtom: number;
  totalRemainingAtoms: number;
  currentCorrect: number;
  currentScore: number;
  diagnosticCeiling: number | null;
  targetScore: number | null;
};

// ============================================================================
// SCORE HISTORY
// ============================================================================

/** Fetches all completed test attempts with PAES scores, ordered by date. */
export async function getScoreHistory(
  userId: string
): Promise<ScoreDataPoint[]> {
  const rows = await db
    .select({
      completedAt: testAttempts.completedAt,
      testId: testAttempts.testId,
      paesScoreMin: testAttempts.paesScoreMin,
      paesScoreMax: testAttempts.paesScoreMax,
      correctAnswers: testAttempts.correctAnswers,
      totalQuestions: testAttempts.totalQuestions,
      testName: tests.name,
    })
    .from(testAttempts)
    .leftJoin(tests, eq(tests.id, testAttempts.testId))
    .where(
      and(
        eq(testAttempts.userId, userId),
        isNotNull(testAttempts.completedAt),
        isNotNull(testAttempts.paesScoreMin)
      )
    )
    .orderBy(testAttempts.completedAt);

  return rows.map((r) => {
    const min = r.paesScoreMin!;
    const max = r.paesScoreMax!;
    return {
      date: r.completedAt!.toISOString(),
      type: r.testId ? "full_test" : "short_diagnostic",
      paesScoreMin: min,
      paesScoreMax: max,
      paesScoreMid: Math.round((min + max) / 2),
      correctAnswers: r.correctAnswers,
      totalQuestions: r.totalQuestions,
      testName: r.testName,
    };
  });
}

// ============================================================================
// UNLOCK CURVE
// ============================================================================

/** Random chance on a 5-option PAES MCQ (baseline for locked questions). */
const DEFAULT_ACC_LOCKED = 0.2;

/** Upper clamp for derived ACC_UNLOCKED. */
const MAX_ACC_UNLOCKED = 0.95;

/** Lower clamp for ACC_UNLOCKED when derived value is unreasonably low. */
const MIN_ACC_UNLOCKED = 0.5;

/** Default ACC_UNLOCKED when there's no data to derive from. */
const FALLBACK_ACC_UNLOCKED = 0.8;

/**
 * Builds a learning order that respects prerequisite chains while
 * prioritising high-efficiency atoms first.
 *
 * For each atom in efficiency order, recursively yields unmastered
 * prerequisites before the atom itself (DFS topological insertion).
 */
function buildLearningOrder(
  efficiencySorted: string[],
  allAtoms: Map<string, AtomWithPrereqs>,
  masteredAtoms: Set<string>
): string[] {
  const result: string[] = [];
  const added = new Set<string>();

  function addWithPrereqs(atomId: string) {
    if (added.has(atomId) || masteredAtoms.has(atomId)) return;
    const atom = allAtoms.get(atomId);
    if (atom) {
      for (const prereqId of atom.prerequisiteIds) {
        addWithPrereqs(prereqId);
      }
    }
    added.add(atomId);
    result.push(atomId);
  }

  for (const atomId of efficiencySorted) {
    addWithPrereqs(atomId);
  }
  return result;
}

/**
 * Builds the unlock curve: a mapping from cumulative atoms mastered
 * to cumulative official questions unlocked.
 *
 * Uses the actual atom-question graph scoped to ~205 M1-relevant
 * atoms and 202 official questions. Atoms are ordered by marginal
 * efficiency (high-impact atoms first), respecting prerequisites.
 */
async function buildUnlockCurve(
  userId: string
): Promise<{
  curve: UnlockCurveEntry[];
  initialUnlocked: number;
  totalRemainingAtoms: number;
}> {
  const [allAtoms, questions, masteryRows] = await Promise.all([
    loadAllAtoms(),
    loadOfficialQuestionsWithAtoms(),
    getMasteryRows(userId),
  ]);

  const directResults = masteryRows.map((r) => ({
    atomId: r.atomId,
    mastered: r.isMastered,
  }));
  const masteryMap: Map<string, AtomMasteryState> = buildMasteryState(
    directResults,
    allAtoms
  );
  const masteredAtoms = getMasteredAtomIds(masteryMap);

  const questionAnalysis = analyzeAllQuestions(questions, masteredAtoms);
  const allStatuses = [
    ...questionAnalysis.unlocked,
    ...questionAnalysis.oneAway,
    ...questionAnalysis.twoAway,
    ...questionAnalysis.threeOrMoreAway,
  ];

  const marginalValues = calculateAllMarginalValues(
    allAtoms,
    questions,
    masteryMap,
    allStatuses
  );

  const efficiencyOrder = marginalValues.map((v) => v.atomId);
  const learningOrder = buildLearningOrder(
    efficiencyOrder,
    allAtoms,
    masteredAtoms
  );

  const initialUnlocked = questionAnalysis.unlocked.length;
  const curve: UnlockCurveEntry[] = [
    { atomsMastered: 0, questionsUnlocked: initialUnlocked },
  ];

  let simulatedMastered = new Set(masteredAtoms);

  for (let i = 0; i < learningOrder.length; i++) {
    const atomId = learningOrder[i];
    const { totalUnlockedAfter } = simulateQuestionUnlocks(
      [atomId],
      questions,
      simulatedMastered
    );
    simulatedMastered = new Set([...simulatedMastered, atomId]);
    curve.push({
      atomsMastered: i + 1,
      questionsUnlocked: totalUnlockedAfter,
    });
  }

  return {
    curve,
    initialUnlocked,
    totalRemainingAtoms: learningOrder.length,
  };
}

// ============================================================================
// ACCURACY DERIVATION
// ============================================================================

/**
 * Derives ACC_UNLOCKED and ACC_LOCKED from the student's actual performance.
 *
 * Two-tier model:
 *   ACC_UNLOCKED — accuracy on questions where all primary atoms mastered
 *   ACC_LOCKED   — accuracy on questions where some primary atoms missing
 *
 * Uses the relationship:
 *   currentCorrect = ACC_UNLOCKED × unlockedPerTest
 *                   + ACC_LOCKED × lockedPerTest
 */
function deriveAccuracy(
  currentCorrect: number,
  questionsUnlocked: number
): { accUnlocked: number; accLocked: number } {
  const unlockedPerTest = questionsUnlocked / NUM_OFFICIAL_TESTS;
  const lockedPerTest = PAES_TOTAL_QUESTIONS - unlockedPerTest;

  if (unlockedPerTest < 1) {
    return { accUnlocked: FALLBACK_ACC_UNLOCKED, accLocked: DEFAULT_ACC_LOCKED };
  }

  if (lockedPerTest < 1) {
    const accUnlocked = Math.min(
      MAX_ACC_UNLOCKED,
      currentCorrect / PAES_TOTAL_QUESTIONS
    );
    return { accUnlocked, accLocked: DEFAULT_ACC_LOCKED };
  }

  let accLocked = DEFAULT_ACC_LOCKED;
  let accUnlocked =
    (currentCorrect - accLocked * lockedPerTest) / unlockedPerTest;

  if (accUnlocked > MAX_ACC_UNLOCKED) {
    accUnlocked = MAX_ACC_UNLOCKED;
    accLocked = (currentCorrect - accUnlocked * unlockedPerTest) / lockedPerTest;
    accLocked = Math.max(0, Math.min(0.8, accLocked));
  } else if (accUnlocked < MIN_ACC_UNLOCKED) {
    accUnlocked = MIN_ACC_UNLOCKED;
    accLocked = (currentCorrect - accUnlocked * unlockedPerTest) / lockedPerTest;
    accLocked = Math.max(0, Math.min(DEFAULT_ACC_LOCKED, accLocked));
  }

  return { accUnlocked, accLocked };
}

// ============================================================================
// PROJECTION METADATA (server-side entry point)
// ============================================================================

/**
 * Computes everything the client needs to render projections locally.
 *
 * Called once on page load. Returns the unlock curve and accuracy
 * metadata so the client can walk the curve at any slider speed
 * without additional API calls.
 */
export async function buildProjectionMetadata(params: {
  userId: string;
  targetScore?: number | null;
  startingScore?: number | null;
}): Promise<ProjectionMetadata | null> {
  const { userId } = params;

  const [snapshot, curveData] = await Promise.all([
    getUserDiagnosticSnapshot(userId),
    buildUnlockCurve(userId),
  ]);

  if (!snapshot?.paesScoreMin || !snapshot?.paesScoreMax) {
    return null;
  }

  const snapshotMid = Math.round(
    (snapshot.paesScoreMin + snapshot.paesScoreMax) / 2
  );
  const currentScore = params.startingScore
    ? Math.max(params.startingScore, snapshotMid)
    : snapshotMid;
  const currentCorrect = estimateCorrectFromScore(currentScore);
  const ceiling = Math.max(snapshot.paesScoreMax, currentScore);

  // Use the curve's initial unlocked count (derived from the same
  // transitivity-based mastery model as the curve itself) so accuracy
  // derivation and unlock simulation share the same source of truth.
  const initialQuestionsUnlocked = curveData.curve[0]?.questionsUnlocked ?? 0;

  const { accUnlocked, accLocked } = deriveAccuracy(
    currentCorrect,
    initialQuestionsUnlocked
  );

  return {
    unlockCurve: curveData.curve,
    accUnlocked,
    accLocked,
    effectiveMinPerAtom: EFFECTIVE_MINUTES_PER_ATOM,
    totalRemainingAtoms: curveData.totalRemainingAtoms,
    currentCorrect,
    currentScore,
    diagnosticCeiling: ceiling,
    targetScore: params.targetScore ?? null,
  };
}
