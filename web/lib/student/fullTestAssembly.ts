/**
 * Pool-Based Full Test Assembly — greedy set-cover for maximum atom coverage.
 *
 * Instead of selecting questions from a single fixed test, this module
 * pools ALL official questions + alternates and picks 60 that cover the
 * most atoms. Coverage is computed with TRANSITIVITY: if a question
 * tests atom B whose prerequisite is A, then both B and A are covered.
 *
 * This ensures comprehensive assessment across the full ~205 M1 atom set,
 * including prerequisite-only atoms that have no direct official questions.
 *
 * Tiebreakers: unseen > seen, alternate > original.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tests, atoms } from "@/db/schema";
import { parseQtiXml } from "@/lib/diagnostic/qtiParser";
import {
  normalizeCorrectAnswer,
  getSeenQuestionIds,
} from "./questionHelpers";
import type { ResolvedQuestion } from "./fullTest";

// ============================================================================
// CONSTANTS
// ============================================================================

const COMPOSITE_TIME_LIMIT = 135;
const DEFAULT_QUESTION_COUNT = 60;

// ============================================================================
// TYPES
// ============================================================================

type PoolQuestion = {
  id: string;
  originalId: string;
  qtiXml: string;
  isAlternate: boolean;
  /** Atoms directly tested by this question */
  primaryAtoms: Set<string>;
  /** Direct + transitive prerequisite atoms (within relevant set) */
  effectiveCoverage: Set<string>;
};

// ============================================================================
// COMPOSITE TEST ENTRY
// ============================================================================

/**
 * Lazily creates a composite test entry for pool-based assembly.
 * Returns the test ID. No schema migration needed — just a data row.
 */
export async function getOrCreateCompositeTest(
  subjectId: string
): Promise<string> {
  const compositeId = `${subjectId}-composite`;
  const [existing] = await db
    .select({ id: tests.id })
    .from(tests)
    .where(eq(tests.id, compositeId))
    .limit(1);

  if (existing) return compositeId;

  await db.insert(tests).values({
    id: compositeId,
    subjectId,
    testType: "official",
    name: "PAES M1 — Test Completo",
    questionCount: DEFAULT_QUESTION_COUNT,
    timeLimitMinutes: COMPOSITE_TIME_LIMIT,
  });

  return compositeId;
}

// ============================================================================
// MAIN ASSEMBLY
// ============================================================================

/**
 * Assembles a test with maximum atom coverage using greedy set-cover.
 *
 * 1. Loads the prerequisite graph for transitive coverage
 * 2. Pools ALL official questions + alternates for the subject
 * 3. Computes effective coverage per question (direct + transitive prereqs)
 * 4. Greedy picks questions covering the most uncovered atoms
 * 5. After full coverage, picks questions that re-test the most atoms
 */
export async function assembleMaxCoverageQuestions(
  userId: string,
  subjectId: string,
  targetCount: number = DEFAULT_QUESTION_COUNT
): Promise<ResolvedQuestion[]> {
  const [pool, seenIds] = await Promise.all([
    buildQuestionPool(subjectId),
    getSeenQuestionIds(userId),
  ]);

  if (pool.length === 0) return [];

  const selected = greedySelect(pool, seenIds, targetCount);

  return selected.map((q, i) => {
    const parsed = parseQtiXml(q.qtiXml);
    const correctAnswer = parsed.correctAnswer
      ? normalizeCorrectAnswer(parsed.correctAnswer)
      : "A";

    return {
      position: i + 1,
      resolvedQuestionId: q.id,
      originalQuestionId: q.originalId,
      qtiXml: q.qtiXml,
      correctAnswer,
      atoms: [...q.primaryAtoms].map((a) => ({
        atomId: a,
        relevance: "primary" as const,
      })),
    };
  });
}

// ============================================================================
// GREEDY SET-COVER SELECTION (uses effectiveCoverage for transitivity)
// ============================================================================

function greedySelect(
  pool: PoolQuestion[],
  seenIds: Set<string>,
  targetCount: number
): PoolQuestion[] {
  const selected: PoolQuestion[] = [];
  const coveredAtoms = new Set<string>();
  const usedIds = new Set<string>();
  const usedOriginals = new Set<string>();

  for (let slot = 0; slot < targetCount && pool.length > 0; slot++) {
    let bestIdx = -1;
    let bestScore = -1;
    let bestUnseen = false;
    let bestIsAlt = false;

    for (let i = 0; i < pool.length; i++) {
      const q = pool[i];
      if (usedIds.has(q.id) || usedOriginals.has(q.originalId)) continue;

      // Count uncovered atoms using transitive effective coverage
      let newAtoms = 0;
      for (const a of q.effectiveCoverage) {
        if (!coveredAtoms.has(a)) newAtoms++;
      }
      // Before full coverage: prioritise uncovered atoms (×1000 weight).
      // After full coverage: score by effective coverage for re-testing.
      const score =
        newAtoms > 0 ? newAtoms * 1000 : q.effectiveCoverage.size;

      const unseen = !seenIds.has(q.id);
      const isAlt = q.isAlternate;

      const better =
        score > bestScore ||
        (score === bestScore && unseen && !bestUnseen) ||
        (score === bestScore &&
          unseen === bestUnseen &&
          isAlt &&
          !bestIsAlt);

      if (better) {
        bestIdx = i;
        bestScore = score;
        bestUnseen = unseen;
        bestIsAlt = isAlt;
      }
    }

    if (bestIdx === -1) break;

    const picked = pool[bestIdx];
    selected.push(picked);
    usedIds.add(picked.id);
    usedOriginals.add(picked.originalId);
    // Mark all transitively covered atoms
    for (const a of picked.effectiveCoverage) coveredAtoms.add(a);

    pool.splice(bestIdx, 1);
  }

  return selected;
}

// ============================================================================
// PREREQUISITE GRAPH — transitive ancestor computation
// ============================================================================

type PrereqGraph = Map<string, string[]>;

/**
 * Loads all atoms and builds a map: atomId → prerequisiteIds[].
 */
async function loadPrereqGraph(): Promise<PrereqGraph> {
  const rows = await db
    .select({ id: atoms.id, prerequisiteIds: atoms.prerequisiteIds })
    .from(atoms);

  const graph: PrereqGraph = new Map();
  for (const row of rows) {
    graph.set(row.id, (row.prerequisiteIds ?? []).filter(Boolean));
  }
  return graph;
}

/**
 * Computes all transitive ancestors (prerequisites) of an atom,
 * filtered to a relevant set. Uses DFS with cycle protection.
 */
function getTransitivePrereqs(
  atomId: string,
  graph: PrereqGraph,
  relevantSet: Set<string>,
  cache: Map<string, Set<string>>
): Set<string> {
  const cached = cache.get(atomId);
  if (cached) return cached;

  const result = new Set<string>();
  const stack = [atomId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (relevantSet.has(current)) result.add(current);

    const prereqs = graph.get(current) ?? [];
    for (const prereq of prereqs) {
      if (!visited.has(prereq)) stack.push(prereq);
    }
  }

  cache.set(atomId, result);
  return result;
}

/**
 * Loads the set of ~205 goal-relevant atoms (same definition as
 * metricsService: directly linked to official questions + their
 * direct prerequisites).
 */
async function loadRelevantAtomIds(): Promise<Set<string>> {
  const rows = (await db.execute(sql`
    WITH directly_linked AS (
      SELECT DISTINCT qa.atom_id AS id
      FROM question_atoms qa
      JOIN questions q ON q.id = qa.question_id
      WHERE q.source = 'official'
    ),
    prereqs AS (
      SELECT DISTINCT unnest(a.prerequisite_ids) AS id
      FROM atoms a
      WHERE a.id IN (SELECT id FROM directly_linked)
        AND a.prerequisite_ids IS NOT NULL
    ),
    relevant AS (
      SELECT id FROM directly_linked
      UNION
      SELECT id FROM prereqs
    )
    SELECT id FROM relevant
  `)) as unknown as { id: string }[];

  return new Set(rows.map((r) => r.id));
}

// ============================================================================
// QUESTION POOL BUILDER
// ============================================================================

/**
 * Builds the full question pool: every official question in the subject's
 * tests plus their alternates. Each question's effective coverage includes
 * its primary atoms PLUS all transitive prerequisites within the relevant
 * atom set.
 */
async function buildQuestionPool(
  subjectId: string
): Promise<PoolQuestion[]> {
  const [rawPool, graph, relevantSet] = await Promise.all([
    fetchRawQuestions(subjectId),
    loadPrereqGraph(),
    loadRelevantAtomIds(),
  ]);

  // Compute transitive coverage per question
  const prereqCache = new Map<string, Set<string>>();
  for (const q of rawPool) {
    const coverage = new Set<string>();
    for (const atomId of q.primaryAtoms) {
      const ancestors = getTransitivePrereqs(
        atomId,
        graph,
        relevantSet,
        prereqCache
      );
      for (const a of ancestors) coverage.add(a);
    }
    q.effectiveCoverage = coverage;
  }

  return rawPool;
}

async function fetchRawQuestions(
  subjectId: string
): Promise<PoolQuestion[]> {
  const rows = (await db.execute(sql`
    SELECT
      q.id, q.qti_xml, q.source, q.parent_question_id, qa.atom_id
    FROM questions q
    JOIN question_atoms qa
      ON qa.question_id = q.id AND qa.relevance = 'primary'
    WHERE q.source = 'official'
      AND q.id IN (
        SELECT tq.question_id
        FROM test_questions tq
        JOIN tests t ON t.id = tq.test_id
        WHERE t.subject_id = ${subjectId}
          AND t.test_type = 'official'
      )
  `)) as unknown as {
    id: string;
    qti_xml: string;
    source: string;
    parent_question_id: string | null;
    atom_id: string;
  }[];

  const officialIds = [...new Set(rows.map((r) => r.id))];
  const altRows =
    officialIds.length > 0
      ? ((await db.execute(sql`
          SELECT
            q.id, q.qti_xml, q.source, q.parent_question_id, qa.atom_id
          FROM questions q
          JOIN question_atoms qa
            ON qa.question_id = q.id AND qa.relevance = 'primary'
          WHERE q.source = 'alternate'
            AND q.parent_question_id IN (${sql.join(
              officialIds.map((id) => sql`${id}`),
              sql`, `
            )})
        `)) as unknown as typeof rows)
      : [];

  const allRows = [...rows, ...altRows];

  const map = new Map<string, PoolQuestion>();
  for (const r of allRows) {
    const existing = map.get(r.id);
    if (existing) {
      existing.primaryAtoms.add(r.atom_id);
    } else {
      map.set(r.id, {
        id: r.id,
        originalId: r.parent_question_id ?? r.id,
        qtiXml: r.qti_xml,
        isAlternate: r.source === "alternate",
        primaryAtoms: new Set([r.atom_id]),
        effectiveCoverage: new Set(),
      });
    }
  }

  return [...map.values()];
}

