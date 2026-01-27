/**
 * Shared types for diagnostic components
 */

import {
  type Route,
  type Axis,
  type MSTQuestion,
} from "@/lib/diagnostic/config";
import { type AxisPerformance } from "../components/ResultsComponents";
import { type LearningRoutesResponse } from "../hooks/useLearningRoutes";
import { type NextConcept } from "@/lib/config";

// ============================================================================
// ATOM MASTERY TYPES
// ============================================================================

/** Atom mastery result from diagnostic */
export interface AtomResult {
  atomId: string;
  mastered: boolean;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/** Response data for question review */
export interface DiagnosticResponse {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
}

// ============================================================================
// ROUTE INFO TYPES
// ============================================================================

/** Top route info for passing to parent */
export interface TopRouteInfo {
  name: string;
  questionsUnlocked: number;
  pointsGain: number;
  studyHours: number;
}

// ============================================================================
// RESULTS SCREEN PROPS
// ============================================================================

export interface ResultsScreenProps {
  results: {
    paesMin: number;
    paesMax: number;
    level: string;
    axisPerformance: Record<Axis, AxisPerformance>;
  };
  route: Route;
  totalCorrect: number;
  /** Atom mastery results from diagnostic for computing learning routes */
  atomResults?: AtomResult[];
  /** All responses from diagnostic for question review */
  responses?: DiagnosticResponse[];
  onSignup: () => void;
  /** Callback to set the consistent PAES score for use in SignupScreen */
  onScoreCalculated?: (score: number) => void;
  /** Callback to set the top route info for use in ThankYouScreen */
  onTopRouteCalculated?: (topRoute: TopRouteInfo | null) => void;
  /** Pre-computed routes data (skips API call when provided - for example mode) */
  precomputedRoutes?: LearningRoutesResponse;
  /** Pre-computed next concepts (skips building from responses - for example mode) */
  precomputedNextConcepts?: NextConcept[];
}
