/**
 * Question Unlock Algorithm - Data Loader
 *
 * Loads atoms, questions, and their relationships from the database.
 * Provides clean data structures for the unlock calculator.
 */

import { db } from "@/db";
import { atoms, questions, questionAtoms } from "@/db/schema";
import { eq } from "drizzle-orm";
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

// ============================================================================
// QUESTION LOADING
// ============================================================================

/**
 * Loads all questions with their atom requirements.
 * Groups atoms by relevance (primary vs secondary).
 */
async function loadQuestionsWithAtoms(): Promise<
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
