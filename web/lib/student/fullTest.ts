/**
 * Full Timed Test — test selection, question resolution, score recalibration.
 *
 * Business logic for the full PAES test flow.
 * API routes are thin wrappers around these functions.
 */

import { and, eq, desc, sql, isNotNull, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  tests,
  testQuestions,
  questions,
  testAttempts,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/diagnostic/qtiParser";
import {
  normalizeCorrectAnswer,
  getSeenQuestionIds,
} from "./questionHelpers";
export { recalibrateScore } from "./fullTestScoring";
export type { RecalibrateParams, RecalibrateResult } from "./fullTestScoring";

// ============================================================================
// TYPES
// ============================================================================

export type AvailableTest = {
  id: string;
  name: string;
  questionCount: number;
  timeLimitMinutes: number | null;
};

export type ResolvedQuestion = {
  position: number;
  resolvedQuestionId: string;
  originalQuestionId: string;
  qtiXml: string;
  correctAnswer: string;
  atoms: { atomId: string; relevance: "primary" | "secondary" }[];
};


// ============================================================================
// RESUME IN-PROGRESS ATTEMPT
// ============================================================================

type InProgressAttempt = {
  attemptId: string;
  testId: string;
  testName: string;
  timeLimitMinutes: number | null;
  startedAt: Date;
};

/**
 * Finds an unfinished full-test attempt (started but not completed).
 * Returns null if no in-progress attempt exists.
 */
export async function getInProgressAttempt(
  userId: string
): Promise<InProgressAttempt | null> {
  const [row] = await db
    .select({
      attemptId: testAttempts.id,
      testId: testAttempts.testId,
      testName: tests.name,
      timeLimitMinutes: tests.timeLimitMinutes,
      startedAt: testAttempts.startedAt,
    })
    .from(testAttempts)
    .innerJoin(tests, eq(tests.id, testAttempts.testId))
    .where(
      and(
        eq(testAttempts.userId, userId),
        isNotNull(testAttempts.testId),
        sql`${testAttempts.completedAt} IS NULL`
      )
    )
    .orderBy(desc(testAttempts.startedAt))
    .limit(1);

  if (!row || !row.testId) return null;

  return {
    attemptId: row.attemptId,
    testId: row.testId,
    testName: row.testName,
    timeLimitMinutes: row.timeLimitMinutes,
    startedAt: row.startedAt,
  };
}

// ============================================================================
// TEST SELECTION
// ============================================================================

/**
 * Returns complete official tests the student hasn't taken yet.
 * A test is "complete" when available questions >= question_count.
 */
export async function getAvailableFullTests(
  userId: string
): Promise<AvailableTest[]> {
  const completedTestIds = db
    .select({ testId: testAttempts.testId })
    .from(testAttempts)
    .where(
      and(
        eq(testAttempts.userId, userId),
        isNotNull(testAttempts.completedAt),
        isNotNull(testAttempts.testId)
      )
    );

  const rows = await db
    .select({
      id: tests.id,
      name: tests.name,
      questionCount: tests.questionCount,
      timeLimitMinutes: tests.timeLimitMinutes,
      available: sql<number>`count(distinct ${testQuestions.questionId})`,
    })
    .from(tests)
    .innerJoin(testQuestions, eq(testQuestions.testId, tests.id))
    .innerJoin(questions, eq(questions.id, testQuestions.questionId))
    .where(
      and(
        eq(tests.testType, "official"),
        notInArray(tests.id, completedTestIds)
      )
    )
    .groupBy(tests.id, tests.name, tests.questionCount, tests.timeLimitMinutes)
    .having(
      sql`count(distinct ${testQuestions.questionId}) >= ${tests.questionCount}`
    )
    .orderBy(tests.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    questionCount: r.questionCount,
    timeLimitMinutes: r.timeLimitMinutes,
  }));
}

// ============================================================================
// QUESTION RESOLUTION
// ============================================================================

/**
 * Resolves all questions for a test with per-student unseen-first assembly.
 *
 * When userId is provided, applies the unseen-first principle:
 * 1. SQL pass: prefer unseen alternates > unseen originals > seen versions
 * 2. App-level pass: substitute still-seen positions with unseen official
 *    questions covering the same primary atoms from outside the test
 *
 * When userId is omitted, falls back to the original behavior (prefer
 * alternates over originals without student awareness).
 *
 * @param excludeAttemptId - ignore responses from this attempt (resume
 *   scenario: mid-test answers should not shift question resolution)
 */
export async function resolveTestQuestions(
  testId: string,
  userId?: string,
  excludeAttemptId?: string
): Promise<ResolvedQuestion[]> {
  const seenIds = userId
    ? await getSeenQuestionIds(userId, excludeAttemptId)
    : new Set<string>();

  const [questionRows, atomRows] = await Promise.all([
    resolveQuestionRows(testId, seenIds),
    fetchAtomMappings(testId),
  ]);

  const atomsByQuestion = groupAtomsByQuestion(atomRows);

  let resolved = questionRows.map((row) => {
    const parsed = parseQtiXml(row.qti_xml);
    const correctAnswer = parsed.correctAnswer
      ? normalizeCorrectAnswer(parsed.correctAnswer)
      : "A";

    return {
      position: row.position,
      resolvedQuestionId: row.resolved_id,
      originalQuestionId: row.original_id,
      qtiXml: row.qti_xml,
      correctAnswer,
      atoms: atomsByQuestion.get(row.original_id) ?? [],
    };
  });

  if (seenIds.size > 0) {
    resolved = await substituteSeenPositions(resolved, seenIds, testId);
  }

  return resolved;
}

type QuestionRow = {
  position: number;
  original_id: string;
  resolved_id: string;
  qti_xml: string;
};

/**
 * Resolve questions with LEFT JOIN for alternates.
 * When seenIds is provided, ORDER BY prefers unseen questions:
 *   1. unseen alternate  2. unseen original  3. seen alternate  4. seen original
 * When seenIds is empty, falls back to: alternate first, then original.
 */
async function resolveQuestionRows(
  testId: string,
  seenIds: Set<string>
): Promise<QuestionRow[]> {
  const seenArray = [...seenIds];
  if (seenArray.length === 0) {
    return db.execute(sql`
      SELECT DISTINCT ON (tq.position)
        tq.position,
        q.id AS original_id,
        COALESCE(alt.id, q.id) AS resolved_id,
        COALESCE(alt.qti_xml, q.qti_xml) AS qti_xml
      FROM test_questions tq
      JOIN questions q ON q.id = tq.question_id
      LEFT JOIN questions alt
        ON alt.parent_question_id = q.id
        AND alt.source = 'alternate'
      WHERE tq.test_id = ${testId}
      ORDER BY tq.position, alt.id NULLS LAST
    `) as unknown as QuestionRow[];
  }

  return db.execute(sql`
    SELECT DISTINCT ON (tq.position)
      tq.position,
      q.id AS original_id,
      COALESCE(alt.id, q.id) AS resolved_id,
      COALESCE(alt.qti_xml, q.qti_xml) AS qti_xml
    FROM test_questions tq
    JOIN questions q ON q.id = tq.question_id
    LEFT JOIN questions alt
      ON alt.parent_question_id = q.id
      AND alt.source = 'alternate'
    WHERE tq.test_id = ${testId}
    ORDER BY
      tq.position,
      CASE WHEN COALESCE(alt.id, q.id) = ANY(${seenArray}) THEN 1 ELSE 0 END,
      CASE WHEN alt.id IS NOT NULL THEN 0 ELSE 1 END,
      alt.id NULLS LAST
  `) as unknown as QuestionRow[];
}

type AtomRow = {
  question_id: string;
  atom_id: string;
  relevance: "primary" | "secondary";
};

/** Query 2: Fetch atom mappings for all questions in a test. */
async function fetchAtomMappings(testId: string): Promise<AtomRow[]> {
  return db.execute(sql`
    SELECT qa.question_id, qa.atom_id, qa.relevance
    FROM question_atoms qa
    WHERE qa.question_id IN (
      SELECT question_id FROM test_questions WHERE test_id = ${testId}
    )
  `) as unknown as AtomRow[];
}

/** Groups atom rows by question_id into a Map. */
function groupAtomsByQuestion(
  atomRows: AtomRow[]
): Map<string, { atomId: string; relevance: "primary" | "secondary" }[]> {
  const map = new Map<
    string,
    { atomId: string; relevance: "primary" | "secondary" }[]
  >();
  for (const row of atomRows) {
    const list = map.get(row.question_id) ?? [];
    list.push({ atomId: row.atom_id, relevance: row.relevance });
    map.set(row.question_id, list);
  }
  return map;
}

// ============================================================================
// CROSS-POSITION SUBSTITUTION (unseen-first, second pass)
// ============================================================================

/**
 * For positions where ALL versions (original + alternates) were already
 * seen, attempt to find an unseen official question that tests the same
 * primary atoms. Only substitutes when a valid replacement exists;
 * keeps the seen question as a last resort.
 */
async function substituteSeenPositions(
  resolved: ResolvedQuestion[],
  seenIds: Set<string>,
  testId: string
): Promise<ResolvedQuestion[]> {
  const seenPositions = resolved.filter((q) =>
    seenIds.has(q.resolvedQuestionId)
  );
  if (seenPositions.length === 0) return resolved;

  const usedQuestionIds = new Set(resolved.map((q) => q.resolvedQuestionId));

  const primaryAtomsByPosition = new Map<number, string[]>();
  for (const q of seenPositions) {
    const atoms = q.atoms
      .filter((a) => a.relevance === "primary")
      .map((a) => a.atomId);
    if (atoms.length > 0) primaryAtomsByPosition.set(q.position, atoms);
  }
  if (primaryAtomsByPosition.size === 0) return resolved;

  const allTargetAtoms = [
    ...new Set([...primaryAtomsByPosition.values()].flat()),
  ];

  // Find unseen official questions covering any of these atoms
  const candidates = (await db.execute(sql`
    SELECT q.id, q.qti_xml, qa.atom_id, qa.relevance
    FROM questions q
    JOIN question_atoms qa ON qa.question_id = q.id AND qa.relevance = 'primary'
    WHERE q.source = 'official'
      AND q.id NOT IN (
        SELECT question_id FROM test_questions WHERE test_id = ${testId}
      )
      AND qa.atom_id = ANY(${allTargetAtoms})
      AND q.id != ALL(${[...seenIds]})
  `)) as unknown as {
    id: string;
    qti_xml: string;
    atom_id: string;
    relevance: "primary" | "secondary";
  }[];

  // Group candidates by question ID
  const candidateMap = new Map<
    string,
    { qtiXml: string; primaryAtoms: Set<string> }
  >();
  for (const c of candidates) {
    if (usedQuestionIds.has(c.id)) continue;
    const entry = candidateMap.get(c.id) ?? {
      qtiXml: c.qti_xml,
      primaryAtoms: new Set<string>(),
    };
    entry.primaryAtoms.add(c.atom_id);
    candidateMap.set(c.id, entry);
  }

  const result = [...resolved];
  for (const [position, targetAtoms] of primaryAtomsByPosition) {
    const targetSet = new Set(targetAtoms);
    let bestId: string | null = null;
    let bestOverlap = 0;
    let bestXml = "";

    for (const [qId, { qtiXml, primaryAtoms }] of candidateMap) {
      if (usedQuestionIds.has(qId)) continue;
      const overlap = [...primaryAtoms].filter((a) => targetSet.has(a)).length;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestId = qId;
        bestXml = qtiXml;
      }
    }

    if (!bestId) continue;

    const idx = result.findIndex((q) => q.position === position);
    if (idx === -1) continue;

    const parsed = parseQtiXml(bestXml);
    const correctAnswer = parsed.correctAnswer
      ? normalizeCorrectAnswer(parsed.correctAnswer)
      : "A";

    result[idx] = {
      ...result[idx],
      resolvedQuestionId: bestId,
      qtiXml: bestXml,
      correctAnswer,
    };

    usedQuestionIds.add(bestId);
    candidateMap.delete(bestId);
  }

  return result;
}

