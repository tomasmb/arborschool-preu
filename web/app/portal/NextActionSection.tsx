/**
 * Shared types for next-action data consumed by LearningPathSection,
 * usePortalDashboard, and portal/types.
 */

export type CompetitiveRoutePayload = {
  axis: string;
  axisDisplayName: string;
  estimatedPointsGain: number;
  atoms: Array<{ atomId: string; title: string }>;
};

export type ReviewItemPayload = {
  atomId: string;
  title: string;
};

export type NextActionPayload = {
  status: "ready" | "missing_diagnostic" | "missing_mastery";
  nextAction: {
    axis: string;
    pointsGain: number;
    studyMinutes: number;
    questionsUnlocked: number;
    firstAtom: {
      atomId: string;
      title: string;
    } | null;
  } | null;
  queuePreview: {
    atomId: string;
    title: string;
    axis: string;
    efficiency: number;
    unlockScore: number;
    totalCost: number;
    prerequisitesNeeded: string[];
  }[];
  competitiveRoutes?: CompetitiveRoutePayload[];
  reviewDueCount?: number;
  reviewItems?: ReviewItemPayload[];
  /** SR balance rule: true when reviews should be done before new atoms */
  reviewSuggested?: boolean;
  /** Atoms flagged by full test that need a quick verification check */
  verificationDueCount?: number;
  verificationItems?: Array<{ atomId: string; title: string }>;
  emptyState: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
};
