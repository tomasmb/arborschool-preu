/**
 * Full Timed Test — test selection, question resolution, score recalibration.
 *
 * Business logic for the full PAES test flow.
 * API routes are thin wrappers around these functions.
 */

import {
  and,
  eq,
  desc,
  sql,
  isNotNull,
  notInArray,
  inArray,
} from "drizzle-orm";
import { db } from "@/db";

/** Transaction-compatible client type for helper functions */
type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
import {
  tests,
  testQuestions,
  questions,
  questionAtoms,
  testAttempts,
  atomMastery,
  users,
} from "@/db/schema";
import { getRetestStatus } from "./retestGating";
import {
  getPaesScore,
  estimateCorrectFromScore,
} from "@/lib/diagnostic/paesScoreTable";
import { parseQtiXml } from "@/lib/diagnostic/qtiParser";
import { getLevel } from "@/lib/diagnostic/config";

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

export type RecalibrateParams = {
  userId: string;
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: {
    originalQuestionId: string;
    isCorrect: boolean;
  }[];
};

export type RecalibrateResult = {
  paesScore: number;
  paesScoreMin: number;
  paesScoreMax: number;
  level: string;
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
 * Strips "Choice" prefix from QTI answer identifiers.
 * e.g. "ChoiceA" → "A", "A" → "A"
 */
function normalizeCorrectAnswer(answer: string): string {
  return answer.startsWith("Choice") ? answer.replace("Choice", "") : answer;
}

/**
 * Resolves all questions for a test, preferring alternates over originals.
 * Returns questions with parsed correct answers and atom mappings.
 */
export async function resolveTestQuestions(
  testId: string
): Promise<ResolvedQuestion[]> {
  const [questionRows, atomRows] = await Promise.all([
    resolveQuestionRows(testId),
    fetchAtomMappings(testId),
  ]);

  const atomsByQuestion = groupAtomsByQuestion(atomRows);

  return questionRows.map((row) => {
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
}

/**
 * Query 1: Resolve questions with LEFT JOIN for alternates.
 * Prefers alternate questions (source='alternate') over originals.
 */
async function resolveQuestionRows(testId: string) {
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
  `) as unknown as {
    position: number;
    original_id: string;
    resolved_id: string;
    qti_xml: string;
  }[];
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
// SCORE RECALIBRATION
// ============================================================================

/**
 * Recalibrates the student's PAES score after completing a full test.
 *
 * Steps:
 * 1. Direct table lookup for PAES score
 * 2. Confidence band ±2 questions (narrower than diagnostic's ±5)
 * 3. Update test_attempts and users rows
 * 4. Upsert atom_mastery for correctly-answered questions
 */
export async function recalibrateScore(
  params: RecalibrateParams
): Promise<RecalibrateResult> {
  const {
    userId,
    attemptId,
    correctAnswers,
    totalQuestions,
    answeredQuestions,
  } = params;

  const paesScore = getPaesScore(correctAnswers);
  const minCorrect = Math.max(0, correctAnswers - 2);
  const maxCorrect = Math.min(60, correctAnswers + 2);
  const paesScoreMin = getPaesScore(minCorrect);
  const paesScoreMax = getPaesScore(maxCorrect);
  const level = getLevel(paesScore);

  const scorePercentage =
    totalQuestions > 0
      ? ((correctAnswers / totalQuestions) * 100).toFixed(2)
      : "0";

  await db.transaction(async (tx) => {
    await updateTestAttempt(tx, attemptId, userId, {
      correctAnswers,
      scorePercentage,
      paesScoreMin,
      paesScoreMax,
    });
    await updateUserScores(tx, userId, paesScoreMin, paesScoreMax);
    await upsertMasteryFromCorrectAnswers(tx, userId, answeredQuestions);
  });

  return { paesScore, paesScoreMin, paesScoreMax, level };
}

async function updateTestAttempt(
  tx: TxClient,
  attemptId: string,
  userId: string,
  data: {
    correctAnswers: number;
    scorePercentage: string;
    paesScoreMin: number;
    paesScoreMax: number;
  }
) {
  await tx
    .update(testAttempts)
    .set({
      correctAnswers: data.correctAnswers,
      scorePercentage: data.scorePercentage,
      paesScoreMin: data.paesScoreMin,
      paesScoreMax: data.paesScoreMax,
      completedAt: new Date(),
    })
    .where(
      and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId))
    );
}

async function updateUserScores(
  tx: TxClient,
  userId: string,
  paesScoreMin: number,
  paesScoreMax: number
) {
  await tx
    .update(users)
    .set({ paesScoreMin, paesScoreMax })
    .where(eq(users.id, userId));
}

/**
 * For each correctly-answered question, upsert atom_mastery for primary atoms.
 * Only marks as mastered if not already mastered.
 */
async function upsertMasteryFromCorrectAnswers(
  tx: TxClient,
  userId: string,
  answeredQuestions: RecalibrateParams["answeredQuestions"]
) {
  const correctOriginals = answeredQuestions
    .filter((q) => q.isCorrect)
    .map((q) => q.originalQuestionId);

  if (correctOriginals.length === 0) return;

  const primaryAtoms = await tx
    .select({
      questionId: questionAtoms.questionId,
      atomId: questionAtoms.atomId,
    })
    .from(questionAtoms)
    .where(
      and(
        inArray(questionAtoms.questionId, correctOriginals),
        eq(questionAtoms.relevance, "primary")
      )
    );

  const now = new Date();
  const nowIso = now.toISOString();
  for (const { atomId } of primaryAtoms) {
    await tx
      .insert(atomMastery)
      .values({
        userId,
        atomId,
        isMastered: true,
        masterySource: "practice_test",
        firstMasteredAt: now,
        status: "mastered",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [atomMastery.userId, atomMastery.atomId],
        set: {
          isMastered: true,
          masterySource: sql`CASE
            WHEN ${atomMastery.isMastered} = true
            THEN ${atomMastery.masterySource}
            ELSE 'practice_test'
          END`,
          firstMasteredAt: sql`COALESCE(
            ${atomMastery.firstMasteredAt},
            ${nowIso}::timestamptz
          )`,
          status: "mastered",
          updatedAt: now,
        },
      });
  }
}
