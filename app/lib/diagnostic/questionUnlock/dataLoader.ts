/**
 * Question Unlock Algorithm - Data Loader
 *
 * Loads atoms, questions, and their relationships from the database.
 * Provides clean data structures for the unlock calculator.
 */

import { db } from "@/db";
import { atoms, questions, questionAtoms } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { AtomWithPrereqs, QuestionWithAtoms } from "./types";

// ============================================================================
// ATOM LOADING
// ============================================================================

/**
 * Loads all atoms with their prerequisites.
 * Returns a map for O(1) lookups.
 */
export async function loadAllAtoms(): Promise<Map<string, AtomWithPrereqs>> {
  const allAtoms = await db
    .select({
      id: atoms.id,
      axis: atoms.axis,
      title: atoms.title,
      prerequisiteIds: atoms.prerequisiteIds,
    })
    .from(atoms);

  const atomMap = new Map<string, AtomWithPrereqs>();

  for (const atom of allAtoms) {
    atomMap.set(atom.id, {
      id: atom.id,
      axis: atom.axis,
      title: atom.title,
      prerequisiteIds: atom.prerequisiteIds || [],
    });
  }

  return atomMap;
}

/**
 * Loads atoms for a specific axis.
 */
export async function loadAtomsByAxis(
  axis: string
): Promise<Map<string, AtomWithPrereqs>> {
  const axisAtoms = await db
    .select({
      id: atoms.id,
      axis: atoms.axis,
      title: atoms.title,
      prerequisiteIds: atoms.prerequisiteIds,
    })
    .from(atoms)
    .where(eq(atoms.axis, axis));

  const atomMap = new Map<string, AtomWithPrereqs>();

  for (const atom of axisAtoms) {
    atomMap.set(atom.id, {
      id: atom.id,
      axis: atom.axis,
      title: atom.title,
      prerequisiteIds: atom.prerequisiteIds || [],
    });
  }

  return atomMap;
}

// ============================================================================
// QUESTION LOADING
// ============================================================================

/**
 * Loads all questions with their atom requirements.
 * Groups atoms by relevance (primary vs secondary).
 */
export async function loadQuestionsWithAtoms(): Promise<
  Map<string, QuestionWithAtoms>
> {
  // Load questions
  const allQuestions = await db
    .select({
      id: questions.id,
      source: questions.source,
      difficultyLevel: questions.difficultyLevel,
    })
    .from(questions);

  // Load all question-atom mappings
  const mappings = await db
    .select({
      questionId: questionAtoms.questionId,
      atomId: questionAtoms.atomId,
      relevance: questionAtoms.relevance,
    })
    .from(questionAtoms);

  // Build question map
  const questionMap = new Map<string, QuestionWithAtoms>();

  for (const q of allQuestions) {
    questionMap.set(q.id, {
      id: q.id,
      source: q.source,
      difficultyLevel: q.difficultyLevel,
      primaryAtomIds: [],
      secondaryAtomIds: [],
    });
  }

  // Add atom mappings to questions
  for (const mapping of mappings) {
    const question = questionMap.get(mapping.questionId);
    if (!question) continue;

    if (mapping.relevance === "primary") {
      question.primaryAtomIds.push(mapping.atomId);
    } else {
      question.secondaryAtomIds.push(mapping.atomId);
    }
  }

  return questionMap;
}

/**
 * Loads only official PAES questions (source = 'official').
 * These are the questions that matter for PAES score improvement.
 */
export async function loadOfficialQuestionsWithAtoms(): Promise<
  Map<string, QuestionWithAtoms>
> {
  const allQuestions = await loadQuestionsWithAtoms();

  const officialQuestions = new Map<string, QuestionWithAtoms>();

  for (const [id, question] of allQuestions) {
    if (question.source === "official") {
      officialQuestions.set(id, question);
    }
  }

  return officialQuestions;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Gets summary statistics about the question-atom coverage.
 * Useful for understanding the data distribution.
 */
export async function getQuestionAtomStats(): Promise<{
  totalQuestions: number;
  officialQuestions: number;
  totalAtoms: number;
  atomsWithQuestions: number;
  totalMappings: number;
  primaryMappings: number;
  secondaryMappings: number;
  avgAtomsPerQuestion: number;
  avgQuestionsPerAtom: number;
}> {
  const [questionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions);

  const [officialCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.source, "official"));

  const [atomCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atoms);

  const atomsWithQsResult = await db.execute(sql`
    SELECT COUNT(DISTINCT atom_id) as count FROM question_atoms
  `);

  const mappingCountsResult = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE relevance = 'primary') as primary_count,
      COUNT(*) FILTER (WHERE relevance = 'secondary') as secondary_count
    FROM question_atoms
  `);

  // Cast raw SQL results to typed arrays
  const atomsWithQsRow = atomsWithQsResult[0] as { count: string } | undefined;
  const mappingCountsRow = mappingCountsResult[0] as
    | { total: string; primary_count: string; secondary_count: string }
    | undefined;

  const total = Number(questionCount.count);
  const official = Number(officialCount.count);
  const totalAtoms = Number(atomCount.count);
  const atomsWithQuestions = Number(atomsWithQsRow?.count || 0);
  const totalMappings = Number(mappingCountsRow?.total || 0);
  const primaryMappings = Number(mappingCountsRow?.primary_count || 0);
  const secondaryMappings = Number(mappingCountsRow?.secondary_count || 0);

  return {
    totalQuestions: total,
    officialQuestions: official,
    totalAtoms,
    atomsWithQuestions,
    totalMappings,
    primaryMappings,
    secondaryMappings,
    avgAtomsPerQuestion: total > 0 ? totalMappings / total : 0,
    avgQuestionsPerAtom: atomsWithQuestions > 0 ? totalMappings / atomsWithQuestions : 0,
  };
}
