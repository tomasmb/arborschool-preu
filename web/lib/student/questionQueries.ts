/**
 * Shared query helpers for generated questions.
 *
 * Centralizes all reads from the `generated_questions` table so that
 * spacedRepetition, prerequisiteScan, and atomMasteryEngine use the
 * same query patterns. The `generated_questions` table is the single
 * source of truth for question content after migration 0012.
 */

import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { generatedQuestions } from "@/db/schema";

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

/** Trims and uppercases a student answer for comparison. */
export function normalizeAnswer(v: string): string {
  return v.trim().toUpperCase();
}
