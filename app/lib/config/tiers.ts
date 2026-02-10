/**
 * Performance Tier Configuration - Single Source of Truth
 *
 * This module defines all tier-specific behavior for the diagnostic results.
 * All tier-related decisions should reference TIER_CONFIG, not hardcoded values.
 *
 * @see temp-docs/conversion-optimization-implementation.md#performance-tier-system
 */

// ============================================================================
// TYPES
// ============================================================================

export type PerformanceTier =
  | "perfect" // 16/16
  | "nearPerfect" // 14-15/16
  | "high" // 11-13/16
  | "average" // 6-10/16
  | "belowAverage" // 3-5/16
  | "veryLow"; // 0-2/16

export type SignalQuality = "high" | "medium" | "low";

/**
 * Projection rule determines how improvement estimates are shown:
 * - none: No projections (not enough signal or no failed questions)
 * - conservative: Only micro-projections tied to specific wrong answers
 * - moderate: Top route projection only
 * - full: Aggregate projection from all wrong answers
 */
export type ProjectionRule = "none" | "conservative" | "moderate" | "full";

/**
 * Score emphasis determines how prominently the PAES score is displayed:
 * - primary: Large, prominent display (standard)
 * - secondary: Smaller, less prominent (below average)
 * - minimal: Present but de-emphasized (very low)
 */
export type ScoreEmphasis = "primary" | "secondary" | "minimal";

export interface TierConfig {
  tier: PerformanceTier;
  signalQuality: SignalQuality;
  projectionRule: ProjectionRule;
  /** Copy shown to explain why certain modules are absent */
  limitationCopy: string;
  /** Whether to show calculated learning routes (vs generic next step) */
  showRoutes: boolean;
  /** Whether to show the PAES score */
  showScore: boolean;
  scoreEmphasis: ScoreEmphasis;
  /** Correct answer range for this tier */
  minCorrect: number;
  maxCorrect: number;
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

/**
 * Single source of truth for all tier-specific rules.
 * Individual tier sections in results screens defer to this config.
 */
export const TIER_CONFIG: Record<PerformanceTier, TierConfig> = {
  perfect: {
    tier: "perfect",
    // Signal is strong on strengths, weak on gap localization
    // Do not "fix" to 'high' — we cannot personalize without knowing gaps
    signalQuality: "medium",
    projectionRule: "none",
    limitationCopy:
      "No detectamos áreas de debilidad en los conceptos evaluados.",
    showRoutes: false,
    showScore: true,
    scoreEmphasis: "primary",
    minCorrect: 16,
    maxCorrect: 16,
  },
  nearPerfect: {
    tier: "nearPerfect",
    signalQuality: "high",
    // GUARDRAIL: Always conservative. Projections tied ONLY to the 1-2 wrong answers.
    // Never aggregate or imply large improvements.
    projectionRule: "conservative",
    limitationCopy:
      "Identificamos área(s) específica(s) a partir de tus respuestas incorrectas.",
    showRoutes: true, // specific area only, from wrong answers
    showScore: true,
    scoreEmphasis: "primary",
    minCorrect: 14,
    maxCorrect: 15,
  },
  high: {
    tier: "high",
    signalQuality: "high",
    projectionRule: "full",
    limitationCopy: "Basado en tus respuestas, identificamos patrones claros.",
    showRoutes: true,
    showScore: true,
    scoreEmphasis: "primary",
    minCorrect: 11,
    maxCorrect: 13,
  },
  average: {
    tier: "average",
    signalQuality: "medium",
    projectionRule: "moderate", // top route only
    limitationCopy:
      "Tu diagnóstico nos da información valiosa sobre dónde enfocarnos.",
    showRoutes: true, // #1 only
    showScore: true,
    scoreEmphasis: "primary",
    minCorrect: 6,
    maxCorrect: 10,
  },
  belowAverage: {
    tier: "belowAverage",
    signalQuality: "low",
    projectionRule: "none",
    limitationCopy:
      "Identificamos un punto de partida. El diagnóstico breve no captura todo.",
    showRoutes: false, // generic "Fundamentos" next step, not calculated routes
    showScore: true,
    scoreEmphasis: "secondary", // show but smaller/less prominent
    minCorrect: 3,
    maxCorrect: 5,
  },
  veryLow: {
    tier: "veryLow",
    signalQuality: "low",
    projectionRule: "none",
    limitationCopy:
      "Con 16 preguntas, el resultado puede no reflejar todo lo que sabes.",
    showRoutes: false,
    showScore: true,
    scoreEmphasis: "minimal", // present but de-emphasized, transparency for parents
    minCorrect: 0,
    maxCorrect: 2,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines the performance tier based on total correct answers.
 * @param totalCorrect - Number of correct answers (0-16)
 * @returns The performance tier
 */
export function getPerformanceTier(totalCorrect: number): PerformanceTier {
  if (totalCorrect === 16) return "perfect";
  if (totalCorrect >= 14) return "nearPerfect";
  if (totalCorrect >= 11) return "high";
  if (totalCorrect >= 6) return "average";
  if (totalCorrect >= 3) return "belowAverage";
  return "veryLow";
}

/**
 * Checks if this is a low-signal tier (below average or very low).
 * Low-signal tiers require different UX treatment.
 * @param tier - The performance tier
 * @returns Whether this is a low-signal tier
 */
export function isLowSignalTier(tier: PerformanceTier): boolean {
  return tier === "belowAverage" || tier === "veryLow";
}
