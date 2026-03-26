/**
 * Shared query helpers for question selection across review flows.
 *
 * Supports two question pools:
 *  - `generated_questions` — AI-generated, 1:1 with atoms (mastery, scan, etc.)
 *  - `questions` (source='alternate') — PAES variants, many-to-many with atoms
 *
 * The review flow tries variant questions first (PAES-realistic context),
 * falling back to generated questions when no eligible variant exists.
 */

import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  generatedQuestions,
  atomStudySessions,
  atomStudyResponses,
  questions,
  questionAtoms,
  atomMastery,
  studentResponses,
} from "@/db/schema";

export type GeneratedQuestionRow = { id: string; qtiXml: string };

/**
 * Finds generated questions for an atom at a given difficulty,
 * excluding already-used IDs. Returns newest first.
 */
export async function findGeneratedQuestions(params: {
  atomId: string;
  difficulty: "low" | "medium" | "high";
  excludeIds?: string[];
  limit?: number;
}): Promise<GeneratedQuestionRow[]> {
  const { atomId, difficulty, excludeIds = [], limit = 1 } = params;
  const conds = [
    eq(generatedQuestions.atomId, atomId),
    eq(generatedQuestions.difficultyLevel, difficulty),
  ];
  if (excludeIds.length > 0) {
    conds.push(notInArray(generatedQuestions.id, excludeIds));
  }
  return db
    .select({ id: generatedQuestions.id, qtiXml: generatedQuestions.qtiXml })
    .from(generatedQuestions)
    .where(and(...conds))
    .orderBy(desc(generatedQuestions.createdAt))
    .limit(limit);
}

/**
 * Resolves the atom ID that a question belongs to.
 * Checks generated_questions first (1:1 atom), then question_atoms (variants).
 */
export async function getQuestionAtomId(
  questionId: string
): Promise<string | null> {
  const [genRow] = await db
    .select({ atomId: generatedQuestions.atomId })
    .from(generatedQuestions)
    .where(eq(generatedQuestions.id, questionId))
    .limit(1);
  if (genRow) return genRow.atomId;

  const [variantRow] = await db
    .select({ atomId: questionAtoms.atomId })
    .from(questionAtoms)
    .where(
      and(
        eq(questionAtoms.questionId, questionId),
        eq(questionAtoms.relevance, "primary")
      )
    )
    .limit(1);
  return variantRow?.atomId ?? null;
}

/**
 * Fetches QTI XML content for a question by ID.
 * Checks generated_questions first, then the questions table (variants).
 */
export async function getQuestionContent(
  questionId: string
): Promise<{ qtiXml: string } | null> {
  const [genRow] = await db
    .select({ qtiXml: generatedQuestions.qtiXml })
    .from(generatedQuestions)
    .where(eq(generatedQuestions.id, questionId))
    .limit(1);
  if (genRow) return genRow;

  const [variantRow] = await db
    .select({ qtiXml: questions.qtiXml })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  return variantRow ?? null;
}

/**
 * Returns IDs of all questions a student has answered for a given atom,
 * across ALL session types (mastery, review, scan, verification).
 * Used to implement the "unseen-first" question selection principle.
 */
export async function getSeenQuestionIds(
  userId: string,
  atomId: string
): Promise<string[]> {
  const sessions = await db
    .select({ id: atomStudySessions.id })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.atomId, atomId)
      )
    );
  if (sessions.length === 0) return [];

  const rows = await db
    .select({ questionId: atomStudyResponses.questionId })
    .from(atomStudyResponses)
    .where(
      inArray(
        atomStudyResponses.sessionId,
        sessions.map((s) => s.id)
      )
    );
  return [...new Set(rows.map((r) => r.questionId))];
}

/**
 * Batch variant: returns a map of atomId → seen question IDs for
 * multiple atoms in two queries instead of 2N.
 */
export async function getBatchSeenQuestionIds(
  userId: string,
  atomIds: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  for (const id of atomIds) result.set(id, []);
  if (atomIds.length === 0) return result;

  const sessions = await db
    .select({
      id: atomStudySessions.id,
      atomId: atomStudySessions.atomId,
    })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        inArray(atomStudySessions.atomId, atomIds)
      )
    );
  if (sessions.length === 0) return result;

  const sessionAtomMap = new Map<string, string>();
  for (const s of sessions) sessionAtomMap.set(s.id, s.atomId);

  const rows = await db
    .select({
      sessionId: atomStudyResponses.sessionId,
      questionId: atomStudyResponses.questionId,
    })
    .from(atomStudyResponses)
    .where(
      inArray(
        atomStudyResponses.sessionId,
        sessions.map((s) => s.id)
      )
    );

  for (const r of rows) {
    const atomId = sessionAtomMap.get(r.sessionId);
    if (atomId) result.get(atomId)!.push(r.questionId);
  }

  for (const [k, v] of result) result.set(k, [...new Set(v)]);
  return result;
}

/**
 * Batch variant: fetches one high-difficulty question per atom,
 * respecting per-atom exclusion lists, in a single query.
 */
export async function findBatchReviewQuestions(
  atomIds: string[],
  excludeMap: Map<string, string[]>
): Promise<Map<string, GeneratedQuestionRow>> {
  const result = new Map<string, GeneratedQuestionRow>();
  if (atomIds.length === 0) return result;

  const rows = await db
    .select({
      id: generatedQuestions.id,
      qtiXml: generatedQuestions.qtiXml,
      atomId: generatedQuestions.atomId,
      createdAt: generatedQuestions.createdAt,
    })
    .from(generatedQuestions)
    .where(
      and(
        inArray(generatedQuestions.atomId, atomIds),
        eq(generatedQuestions.difficultyLevel, "high")
      )
    )
    .orderBy(desc(generatedQuestions.createdAt));

  for (const row of rows) {
    if (result.has(row.atomId)) continue;
    const excluded = excludeMap.get(row.atomId) ?? [];
    if (excluded.includes(row.id)) continue;
    result.set(row.atomId, { id: row.id, qtiXml: row.qtiXml });
  }
  return result;
}

/**
 * For each due atom, finds an eligible unseen variant (alternate) question.
 *
 * Eligibility: every OTHER primary atom on the variant must already be
 * mastered by the student, so we never test atoms the student hasn't learned.
 *
 * Freshness: excludes variants the student has answered in full tests,
 * diagnostics (student_responses), or prior SR sessions (atom_study_responses).
 *
 * Returns at most one variant per atom; atoms with no eligible variant
 * are absent from the map (caller falls back to generated questions).
 */
export async function findBatchReviewVariants(
  atomIds: string[],
  userId: string
): Promise<Map<string, GeneratedQuestionRow>> {
  const result = new Map<string, GeneratedQuestionRow>();
  if (atomIds.length === 0) return result;

  // 1. Load all alternate questions where any target atom is primary
  const candidates = await db
    .select({
      questionId: questions.id,
      qtiXml: questions.qtiXml,
      atomId: questionAtoms.atomId,
    })
    .from(questionAtoms)
    .innerJoin(questions, eq(questions.id, questionAtoms.questionId))
    .where(
      and(
        inArray(questionAtoms.atomId, atomIds),
        eq(questionAtoms.relevance, "primary"),
        eq(questions.source, "alternate")
      )
    );

  if (candidates.length === 0) return result;

  // 2. Collect all candidate question IDs
  const allCandidateIds = new Set<string>();
  for (const c of candidates) allCandidateIds.add(c.questionId);

  // 3. Load ALL primary atoms for each candidate question (not just target atoms)
  const candidateIdArray = [...allCandidateIds];
  const allPrimaryAtoms = await db
    .select({
      questionId: questionAtoms.questionId,
      atomId: questionAtoms.atomId,
    })
    .from(questionAtoms)
    .where(
      and(
        inArray(questionAtoms.questionId, candidateIdArray),
        eq(questionAtoms.relevance, "primary")
      )
    );

  const questionAllPrimary = new Map<string, Set<string>>();
  for (const row of allPrimaryAtoms) {
    const existing = questionAllPrimary.get(row.questionId);
    if (existing) existing.add(row.atomId);
    else questionAllPrimary.set(row.questionId, new Set([row.atomId]));
  }

  // 4. Load mastered atom set for eligibility checking
  const masteredRows = await db
    .select({ atomId: atomMastery.atomId })
    .from(atomMastery)
    .where(
      and(eq(atomMastery.userId, userId), eq(atomMastery.isMastered, true))
    );
  const masteredSet = new Set(masteredRows.map((r) => r.atomId));

  // 5. Load seen variant IDs from student_responses (full tests + diagnostic)
  const seenFromTests = await db
    .select({ questionId: studentResponses.questionId })
    .from(studentResponses)
    .where(
      and(
        eq(studentResponses.userId, userId),
        inArray(studentResponses.questionId, candidateIdArray)
      )
    );
  const seenIds = new Set(
    seenFromTests.filter((r) => r.questionId).map((r) => r.questionId!)
  );

  // Also check atom_study_responses for variants used in prior SR sessions
  const seenFromSR = await db
    .select({ questionId: atomStudyResponses.questionId })
    .from(atomStudyResponses)
    .innerJoin(
      atomStudySessions,
      eq(atomStudySessions.id, atomStudyResponses.sessionId)
    )
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        inArray(atomStudyResponses.questionId, candidateIdArray)
      )
    );
  for (const r of seenFromSR) seenIds.add(r.questionId);

  // 6. For each target atom, find the best eligible variant
  for (const atomId of atomIds) {
    if (result.has(atomId)) continue;

    // Gather candidate questions for this atom, preferring unseen
    const atomCandidates: Array<{
      id: string;
      qtiXml: string;
      unseen: boolean;
    }> = [];

    for (const c of candidates) {
      if (c.atomId !== atomId) continue;

      // Eligibility: all OTHER primary atoms must be mastered
      const allPrimary = questionAllPrimary.get(c.questionId);
      if (!allPrimary) continue;
      const otherPrimaries = [...allPrimary].filter((a) => a !== atomId);
      const eligible = otherPrimaries.every((a) => masteredSet.has(a));
      if (!eligible) continue;

      atomCandidates.push({
        id: c.questionId,
        qtiXml: c.qtiXml,
        unseen: !seenIds.has(c.questionId),
      });
    }

    // Pick unseen first, then any eligible variant
    const unseen = atomCandidates.find((c) => c.unseen);
    const pick = unseen ?? atomCandidates[0];
    if (pick) {
      result.set(atomId, { id: pick.id, qtiXml: pick.qtiXml });
    }
  }

  return result;
}

/** Trims and uppercases a student answer for comparison. */
export function normalizeAnswer(v: string): string {
  return v.trim().toUpperCase();
}
