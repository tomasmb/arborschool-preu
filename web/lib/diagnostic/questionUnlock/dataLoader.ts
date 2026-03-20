/**
 * Question Unlock Algorithm - Data Loader
 *
 * Loads atoms, questions, and their relationships from the database.
 * Provides clean data structures for the unlock calculator.
 *
 * Content data (atoms, questions, question_atoms) is essentially static
 * and cached for 1 hour via unstable_cache to avoid full table scans
 * on every dashboard / next-action request.
 */

import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { atoms, questions, questionAtoms } from "@/db/schema";
import type { AtomWithPrereqs, QuestionWithAtoms } from "./types";

// ============================================================================
// ATOM LOADING
// ============================================================================

/** Raw DB fetch wrapped with unstable_cache (1-hour TTL). */
const fetchAllAtomsRaw = unstable_cache(
  async (): Promise<AtomWithPrereqs[]> => {
    const rows = await db
      .select({
        id: atoms.id,
        axis: atoms.axis,
        title: atoms.title,
        prerequisiteIds: atoms.prerequisiteIds,
      })
      .from(atoms);

    return rows.map((a) => ({
      id: a.id,
      axis: a.axis,
      title: a.title,
      prerequisiteIds: a.prerequisiteIds || [],
    }));
  },
  ["all-atoms"],
  { revalidate: 3600, tags: ["content-atoms"] }
);

/**
 * Loads all atoms with their prerequisites.
 * Returns a map for O(1) lookups. Underlying data is cached for 1 hour.
 */
export async function loadAllAtoms(): Promise<Map<string, AtomWithPrereqs>> {
  const rows = await fetchAllAtomsRaw();
  return new Map(rows.map((r) => [r.id, r]));
}

// ============================================================================
// QUESTION LOADING
// ============================================================================

type QuestionRow = {
  id: string;
  source: string;
  difficultyLevel: string;
};

type MappingRow = {
  questionId: string;
  atomId: string;
  relevance: string;
};

type QuestionsWithMappings = {
  questions: QuestionRow[];
  mappings: MappingRow[];
};

/** Raw DB fetch for questions + mappings, cached for 1 hour. */
const fetchQuestionsWithMappingsRaw = unstable_cache(
  async (): Promise<QuestionsWithMappings> => {
    const [allQuestions, mappings] = await Promise.all([
      db
        .select({
          id: questions.id,
          source: questions.source,
          difficultyLevel: questions.difficultyLevel,
        })
        .from(questions),
      db
        .select({
          questionId: questionAtoms.questionId,
          atomId: questionAtoms.atomId,
          relevance: questionAtoms.relevance,
        })
        .from(questionAtoms),
    ]);

    return { questions: allQuestions, mappings };
  },
  ["all-questions-with-mappings"],
  { revalidate: 3600, tags: ["content-questions"] }
);

/**
 * Assembles the question map from cached raw data.
 * Groups atoms by relevance (primary vs secondary).
 */
function buildQuestionMap(
  data: QuestionsWithMappings
): Map<string, QuestionWithAtoms> {
  const questionMap = new Map<string, QuestionWithAtoms>();

  for (const q of data.questions) {
    questionMap.set(q.id, {
      id: q.id,
      source: q.source,
      difficultyLevel: q.difficultyLevel,
      primaryAtomIds: [],
      secondaryAtomIds: [],
    });
  }

  for (const mapping of data.mappings) {
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
 * Underlying data is cached for 1 hour.
 */
export async function loadOfficialQuestionsWithAtoms(): Promise<
  Map<string, QuestionWithAtoms>
> {
  const raw = await fetchQuestionsWithMappingsRaw();
  const allQuestions = buildQuestionMap(raw);

  const officialQuestions = new Map<string, QuestionWithAtoms>();
  for (const [id, question] of allQuestions) {
    if (question.source === "official") {
      officialQuestions.set(id, question);
    }
  }

  return officialQuestions;
}
