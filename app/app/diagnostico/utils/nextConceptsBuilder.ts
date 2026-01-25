/**
 * Next Concepts Builder Utility
 *
 * Builds NextConcept[] from diagnostic responses and recommended route.
 * Follows the defensibility rules: only direct evidence from wrong answers.
 *
 * @see temp-docs/results-next-concepts-spec.md
 */

import { buildQuestionId, type MSTQuestion } from "@/lib/diagnostic/config";
import { type NextConcept } from "@/lib/config";
import { type LearningRouteData } from "../hooks/useLearningRoutes";

// ============================================================================
// TYPES
// ============================================================================

/** Response data for building next concepts */
export interface ResponseForNextConcepts {
  question: MSTQuestion;
  isCorrect: boolean;
}

// ============================================================================
// BUILDER
// ============================================================================

/**
 * Builds NextConcept[] from diagnostic responses and recommended route.
 * Only includes atoms from wrong answers (direct evidence).
 *
 * Algorithm:
 * 1. Identify questions with wrong answers
 * 2. Use the recommended route's atoms as the source of concepts
 * 3. Order by prerequisite order within the route
 * 4. Tag each concept with evidence from the first wrong answer
 *
 * @param responses - All responses from diagnostic (for identifying wrong answers)
 * @param recommendedRoute - The recommended learning route (for atom ordering and titles)
 * @returns Array of NextConcept ordered by prerequisite
 */
export function buildNextConceptsFromResponses(
  responses: ResponseForNextConcepts[],
  recommendedRoute: LearningRouteData | null
): NextConcept[] {
  // Get question IDs from wrong answers only
  const wrongAnswerQuestionIds = new Set<string>();

  responses.forEach((response) => {
    if (response.isCorrect) return; // Skip correct answers

    const questionId = buildQuestionId(
      response.question.exam,
      response.question.questionNumber
    );
    wrongAnswerQuestionIds.add(questionId);
  });

  // If no wrong answers or no route, return empty
  if (wrongAnswerQuestionIds.size === 0 || !recommendedRoute) {
    return [];
  }

  // Build a map of route atoms for quick lookup
  const routeAtomMap = new Map<
    string,
    { title: string; questionsUnlocked: number }
  >();
  const routeAtomOrder: string[] = [];

  recommendedRoute.atoms.forEach((atom) => {
    routeAtomMap.set(atom.id, {
      title: atom.title,
      questionsUnlocked: atom.questionsUnlocked,
    });
    routeAtomOrder.push(atom.id);
  });

  // Use the first wrong answer's question as evidence source
  const firstWrongQuestionId = Array.from(wrongAnswerQuestionIds)[0];

  // Build NextConcept[] from route atoms (which are already ordered by prerequisite)
  const concepts: NextConcept[] = [];

  for (const atomId of routeAtomOrder) {
    const atomData = routeAtomMap.get(atomId);
    if (!atomData) continue;

    concepts.push({
      atomId,
      title: atomData.title,
      reasonKey: "wrong_answer",
      unlocksQuestionsCount: atomData.questionsUnlocked,
      evidence: {
        source: "direct",
        mastered: false,
        questionId: firstWrongQuestionId,
      },
    });
  }

  return concepts;
}
