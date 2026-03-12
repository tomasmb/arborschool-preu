/**
 * Shared query helpers for generated questions.
 *
 * Centralizes all reads from the `generated_questions` table so that
 * spacedRepetition, prerequisiteScan, and atomMasteryEngine use the
 * same query patterns. The `generated_questions` table is the single
 * source of truth for question content after migration 0012.
 */

import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  generatedQuestions,
  atomStudySessions,
  atomStudyResponses,
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

/** Resolves the atom ID that a generated question belongs to. */
export async function getQuestionAtomId(
  questionId: string
): Promise<string | null> {
  const [row] = await db
    .select({ atomId: generatedQuestions.atomId })
    .from(generatedQuestions)
    .where(eq(generatedQuestions.id, questionId))
    .limit(1);
  return row?.atomId ?? null;
}

/** Fetches QTI XML content for a generated question by ID. */
export async function getQuestionContent(
  questionId: string
): Promise<{ qtiXml: string } | null> {
  const [row] = await db
    .select({ qtiXml: generatedQuestions.qtiXml })
    .from(generatedQuestions)
    .where(eq(generatedQuestions.id, questionId))
    .limit(1);
  return row ?? null;
}

/**
 * Returns IDs of all generated questions a student has answered for a
 * given atom, across ALL session types (mastery, review, scan, verification).
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

/** Trims and uppercases a student answer for comparison. */
export function normalizeAnswer(v: string): string {
  return v.trim().toUpperCase();
}
