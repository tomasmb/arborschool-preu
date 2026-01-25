/**
 * Next Concepts Configuration & Helpers
 *
 * Defines types and utilities for the "Next Concepts" micro-preview feature.
 * Shows personalized concepts derived ONLY from wrong answers (direct evidence).
 *
 * @see temp-docs/results-next-concepts-spec.md
 */

import { type PerformanceTier } from "./tiers";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Evidence for why a concept is suggested.
 * MUST come from direct test results (wrong answers only).
 */
export interface NextConceptEvidence {
  source: "direct";
  mastered: false;
  questionId: string;
}

/**
 * Reason for suggesting a concept.
 * - wrong_answer: Detected from a failed question
 * - unlocks_questions: Leads to unlocking PAES questions
 */
export type NextConceptReasonKey = "wrong_answer" | "unlocks_questions";

/**
 * A concept to learn next, derived from diagnostic results.
 * Only includes concepts backed by wrong-answer evidence.
 */
export interface NextConcept {
  atomId: string;
  /** Short user-facing concept label */
  title: string;
  /** Why this concept is suggested */
  reasonKey: NextConceptReasonKey;
  /** How many questions this concept helps unlock (optional) */
  unlocksQuestionsCount?: number;
  /** Direct evidence from wrong answer */
  evidence: NextConceptEvidence;
}

/**
 * Configuration for next concepts display per tier.
 */
export interface NextConceptsConfig {
  /** Whether to show personalized next concepts */
  showPersonalized: boolean;
  /** Whether to show generic foundations ladder instead */
  showGenericLadder: boolean;
  /** Maximum items to show by default */
  maxDefault: number;
  /** Maximum items to show when expanded */
  maxExpanded: number;
}

// ============================================================================
// TIER-SPECIFIC CONFIGURATION
// ============================================================================

/**
 * Gets the next concepts configuration for a performance tier.
 * Follows the spec's tier gating rules.
 */
export function getNextConceptsConfig(
  tier: PerformanceTier
): NextConceptsConfig {
  switch (tier) {
    case "perfect":
      // No personalized concepts - no wrong answers to derive from
      return {
        showPersonalized: false,
        showGenericLadder: false,
        maxDefault: 0,
        maxExpanded: 0,
      };

    case "nearPerfect":
      // Only 1-2 items, tied to the 1-2 wrong answers
      return {
        showPersonalized: true,
        showGenericLadder: false,
        maxDefault: 2,
        maxExpanded: 2,
      };

    case "high":
    case "average":
      // Full personalized preview: 3 default, 5 max
      return {
        showPersonalized: true,
        showGenericLadder: false,
        maxDefault: 3,
        maxExpanded: 5,
      };

    case "belowAverage":
    case "veryLow":
      // Generic foundations ladder only
      return {
        showPersonalized: false,
        showGenericLadder: true,
        maxDefault: 0,
        maxExpanded: 0,
      };
  }
}

/**
 * Checks if next concepts preview should be shown for a tier.
 */
export function shouldShowNextConcepts(tier: PerformanceTier): boolean {
  const config = getNextConceptsConfig(tier);
  return config.showPersonalized || config.showGenericLadder;
}

// ============================================================================
// CONCEPT BUILDING
// ============================================================================

/**
 * Input for building next concepts from diagnostic results.
 */
export interface BuildNextConceptsInput {
  /** All atoms with mastery results from diagnostic */
  atomResults: Array<{
    atomId: string;
    mastered: boolean;
    source: "direct" | "inferred" | "not_tested";
    /** Question ID that tested this atom (if direct) */
    questionId?: string;
    /** User-facing title for the atom */
    title?: string;
    /** Number of questions this atom helps unlock */
    questionsUnlocked?: number;
  }>;
  /** Only include atoms from wrong answers */
  failedQuestionsOnly: boolean;
  /** Only include directly tested atoms */
  directOnly: boolean;
  /** Optional: atoms from the recommended route (for ordering) */
  recommendedRouteAtoms?: string[];
}

/**
 * Builds the next concepts list from diagnostic results.
 * Applies defensibility rules: only direct + not mastered from wrong answers.
 *
 * @returns Deduplicated, ordered list of NextConcept
 */
export function buildNextConcepts(
  input: BuildNextConceptsInput
): NextConcept[] {
  const {
    atomResults,
    failedQuestionsOnly,
    directOnly,
    recommendedRouteAtoms,
  } = input;

  // Filter to only valid atoms (direct, not mastered)
  const validAtoms = atomResults.filter((atom) => {
    // Must be direct test result
    if (directOnly && atom.source !== "direct") return false;
    // Must be not mastered (wrong answer)
    if (failedQuestionsOnly && atom.mastered) return false;
    // Must have question evidence
    if (!atom.questionId) return false;
    return true;
  });

  // Deduplicate by atomId (keep first occurrence)
  const seenAtomIds = new Set<string>();
  const dedupedAtoms = validAtoms.filter((atom) => {
    if (seenAtomIds.has(atom.atomId)) return false;
    seenAtomIds.add(atom.atomId);
    return true;
  });

  // Build NextConcept objects
  const concepts: NextConcept[] = dedupedAtoms.map((atom) => ({
    atomId: atom.atomId,
    title: atom.title || atom.atomId,
    reasonKey: "wrong_answer" as const,
    unlocksQuestionsCount: atom.questionsUnlocked,
    evidence: {
      source: "direct" as const,
      mastered: false as const,
      questionId: atom.questionId!,
    },
  }));

  // Sort by:
  // 1. Prerequisite order within route (if provided)
  // 2. Highest unlock impact
  // 3. Stable tie-breaker (atomId)
  return concepts.sort((a, b) => {
    // Route order priority
    if (recommendedRouteAtoms) {
      const aIndex = recommendedRouteAtoms.indexOf(a.atomId);
      const bIndex = recommendedRouteAtoms.indexOf(b.atomId);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }

    // Unlock impact (higher first)
    const aUnlocks = a.unlocksQuestionsCount || 0;
    const bUnlocks = b.unlocksQuestionsCount || 0;
    if (aUnlocks !== bUnlocks) return bUnlocks - aUnlocks;

    // Stable tie-breaker
    return a.atomId.localeCompare(b.atomId);
  });
}

// ============================================================================
// GENERIC FOUNDATIONS LADDER
// ============================================================================

/**
 * Generic foundations ladder steps for low-signal tiers.
 * Shown when we can't give personalized recommendations.
 */
export const GENERIC_FOUNDATIONS_LADDER = [
  {
    step: 1,
    title: "Fundamentos de Números",
    description: "Operaciones básicas y propiedades numéricas",
  },
  {
    step: 2,
    title: "Álgebra básica",
    description: "Expresiones, ecuaciones y despeje de variables",
  },
  {
    step: 3,
    title: "Funciones base",
    description: "Concepto de función, dominio y recorrido",
  },
] as const;

export type FoundationsLadderStep = (typeof GENERIC_FOUNDATIONS_LADDER)[number];
