import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { atomMastery, atomStudySessions, users } from "@/db/schema";
import {
  analyzeLearningPotential,
  type StudentLearningAnalysis,
} from "@/lib/diagnostic/questionUnlock";
import { getReviewDueItems } from "./spacedRepetition";

type NextActionStatus = "ready" | "missing_diagnostic" | "missing_mastery";

type NextActionEmptyState = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
} | null;

export type NextActionItem = {
  axis: string;
  pointsGain: number;
  studyMinutes: number;
  questionsUnlocked: number;
  firstAtom: {
    atomId: string;
    title: string;
  } | null;
};

export type QueuePreviewItem = {
  atomId: string;
  title: string;
  axis: string;
  efficiency: number;
  unlockScore: number;
  totalCost: number;
  prerequisitesNeeded: string[];
};

export type CompetitiveRoute = {
  axis: string;
  axisDisplayName: string;
  estimatedPointsGain: number;
  atoms: Array<{ atomId: string; title: string }>;
};

export type NextActionInsights = {
  topRoutes: StudentLearningAnalysis["routes"];
  nextAction: NextActionItem | null;
  queuePreview: QueuePreviewItem[];
  competitiveRoutes: CompetitiveRoute[];
};

export type ReviewItemPreview = {
  atomId: string;
  title: string;
};

export type StudentNextActionData = {
  status: NextActionStatus;
  nextAction: NextActionItem | null;
  queuePreview: QueuePreviewItem[];
  competitiveRoutes?: CompetitiveRoute[];
  reviewDueCount: number;
  reviewItems: ReviewItemPreview[];
  /** True when the SR balance rule suggests a review block before new atoms */
  reviewSuggested: boolean;
  emptyState: NextActionEmptyState;
};

type MasteryRow = {
  atomId: string;
  isMastered: boolean;
  cooldown: number | null;
};

function byRoutePriority(
  a: StudentLearningAnalysis["routes"][number],
  b: StudentLearningAnalysis["routes"][number]
): number {
  if (b.totalQuestionsUnlocked !== a.totalQuestionsUnlocked) {
    return b.totalQuestionsUnlocked - a.totalQuestionsUnlocked;
  }
  if (b.estimatedPointsGain !== a.estimatedPointsGain) {
    return b.estimatedPointsGain - a.estimatedPointsGain;
  }
  if (a.estimatedMinutes !== b.estimatedMinutes) {
    return a.estimatedMinutes - b.estimatedMinutes;
  }

  return a.axis.localeCompare(b.axis);
}

function byAtomPriority(
  a: StudentLearningAnalysis["topAtomsByEfficiency"][number],
  b: StudentLearningAnalysis["topAtomsByEfficiency"][number]
): number {
  if (b.efficiency !== a.efficiency) {
    return b.efficiency - a.efficiency;
  }
  if (b.unlockScore !== a.unlockScore) {
    return b.unlockScore - a.unlockScore;
  }
  if (a.totalCost !== b.totalCost) {
    return a.totalCost - b.totalCost;
  }

  return a.atomId.localeCompare(b.atomId);
}

const COMPETITIVE_THRESHOLD = 0.8;
const ROUTE_ATOM_PREVIEW_COUNT = 3;

function toCompetitiveRoute(
  route: StudentLearningAnalysis["routes"][number]
): CompetitiveRoute {
  return {
    axis: route.axis,
    axisDisplayName: route.axisDisplayName,
    estimatedPointsGain: route.estimatedPointsGain,
    atoms: route.atoms
      .slice(0, ROUTE_ATOM_PREVIEW_COUNT)
      .map((a) => ({ atomId: a.atomId, title: a.title })),
  };
}

/**
 * Returns the top route always, plus a second route when it's
 * within COMPETITIVE_THRESHOLD of the top route's points gain.
 */
function buildCompetitiveRoutes(
  routes: StudentLearningAnalysis["routes"]
): CompetitiveRoute[] {
  if (routes.length === 0) return [];

  const result = [toCompetitiveRoute(routes[0])];

  if (
    routes.length > 1 &&
    routes[0].estimatedPointsGain > 0 &&
    routes[1].estimatedPointsGain >=
      routes[0].estimatedPointsGain * COMPETITIVE_THRESHOLD
  ) {
    result.push(toCompetitiveRoute(routes[1]));
  }

  return result;
}

export function buildNextActionInsights(
  analysis: StudentLearningAnalysis
): NextActionInsights {
  const routes = [...analysis.routes].sort(byRoutePriority);
  const topRoute = routes[0] ?? null;

  const topAtoms = [...analysis.topAtomsByEfficiency]
    .sort(byAtomPriority)
    .slice(0, 5)
    .map((atom) => ({
      atomId: atom.atomId,
      title: atom.title,
      axis: atom.axis,
      efficiency: Math.round(atom.efficiency * 1000) / 1000,
      unlockScore: Math.round(atom.unlockScore * 1000) / 1000,
      totalCost: atom.totalCost,
      prerequisitesNeeded: [...atom.prerequisitesNeeded].sort((a, b) =>
        a.localeCompare(b)
      ),
    }));

  const competitiveRoutes = buildCompetitiveRoutes(routes);

  return {
    topRoutes: routes,
    nextAction: topRoute
      ? {
          axis: topRoute.axisDisplayName,
          pointsGain: topRoute.estimatedPointsGain,
          studyMinutes: topRoute.estimatedMinutes,
          questionsUnlocked: topRoute.totalQuestionsUnlocked,
          firstAtom: topRoute.atoms[0]
            ? {
                atomId: topRoute.atoms[0].atomId,
                title: topRoute.atoms[0].title,
              }
            : null,
        }
      : null,
    queuePreview: topAtoms,
    competitiveRoutes,
  };
}

function buildEmptyState(status: Exclude<NextActionStatus, "ready">) {
  if (status === "missing_diagnostic") {
    return {
      title: "Activa tu planificación",
      description:
        "Antes del diagnóstico define tu meta objetivo para personalizar tu primera mini-clase.",
      ctaLabel: "Ir a planificación",
      ctaHref: "/portal/goals?mode=planning",
    };
  }

  return {
    title: "Aún no hay señal de aprendizaje",
    description:
      "Todavía no hay registros de dominio por concepto para priorizar tu siguiente acción.",
    ctaLabel: "Comenzar mini-clase",
    ctaHref: "/portal/study",
  };
}

async function getUserDiagnosticSnapshot(userId: string) {
  const rows = await db
    .select({
      paesScoreMin: users.paesScoreMin,
      paesScoreMax: users.paesScoreMax,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

async function getMasteryRows(userId: string): Promise<MasteryRow[]> {
  return db
    .select({
      atomId: atomMastery.atomId,
      isMastered: atomMastery.isMastered,
      cooldown: atomMastery.cooldownUntilMasteryCount,
    })
    .from(atomMastery)
    .where(eq(atomMastery.userId, userId));
}

/** Suggest review block after this many new masteries (spec 7.10). */
const SR_BALANCE_THRESHOLD = 3;

/**
 * Counts mastery sessions completed since the user's last review session.
 * Used by the balance rule to interleave reviews after 2-3 new masteries.
 */
async function getMasteriesSinceLastReview(userId: string): Promise<number> {
  const [lastReview] = await db
    .select({ completedAt: atomStudySessions.completedAt })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.sessionType, "review"),
        sql`${atomStudySessions.completedAt} IS NOT NULL`
      )
    )
    .orderBy(desc(atomStudySessions.completedAt))
    .limit(1);

  const since = lastReview?.completedAt ?? new Date(0);

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(atomStudySessions)
    .where(
      and(
        eq(atomStudySessions.userId, userId),
        eq(atomStudySessions.sessionType, "mastery"),
        eq(atomStudySessions.status, "mastered"),
        gt(atomStudySessions.completedAt, since)
      )
    );

  return Number(row?.count ?? 0);
}

export async function getStudentNextAction(
  userId: string
): Promise<StudentNextActionData> {
  const [snapshot, masteryRows] = await Promise.all([
    getUserDiagnosticSnapshot(userId),
    getMasteryRows(userId),
  ]);

  const minScore = snapshot?.paesScoreMin ?? null;
  const maxScore = snapshot?.paesScoreMax ?? null;
  const hasDiagnostic = minScore !== null && maxScore !== null;

  if (!hasDiagnostic) {
    return {
      status: "missing_diagnostic",
      nextAction: null,
      queuePreview: [],
      reviewDueCount: 0,
      reviewItems: [],
      reviewSuggested: false,
      emptyState: buildEmptyState("missing_diagnostic"),
    };
  }

  if (masteryRows.length === 0) {
    return {
      status: "missing_mastery",
      nextAction: null,
      queuePreview: [],
      reviewDueCount: 0,
      reviewItems: [],
      reviewSuggested: false,
      emptyState: buildEmptyState("missing_mastery"),
    };
  }

  const currentScore = Math.round((minScore + maxScore) / 2);

  // Exclude atoms in cooldown from route analysis so they aren't suggested
  const eligibleRows = masteryRows.filter(
    (r) => !(r.cooldown && r.cooldown > 0)
  );

  const [analysis, reviewDueItems, masteriesSinceReview] = await Promise.all([
    analyzeLearningPotential(
      eligibleRows.map((row) => ({
        atomId: row.atomId,
        mastered: row.isMastered,
      })),
      { currentPaesScore: currentScore }
    ),
    getReviewDueItems(userId),
    getMasteriesSinceLastReview(userId),
  ]);

  const insights = buildNextActionInsights(analysis);

  // Spec 7.10: suggest review block after N newly mastered atoms
  const reviewSuggested =
    reviewDueItems.length > 0 && masteriesSinceReview >= SR_BALANCE_THRESHOLD;

  return {
    status: "ready",
    nextAction: insights.nextAction,
    queuePreview: insights.queuePreview,
    competitiveRoutes: insights.competitiveRoutes,
    reviewDueCount: reviewDueItems.length,
    reviewItems: reviewDueItems.map((r) => ({
      atomId: r.atomId,
      title: r.atomTitle,
    })),
    reviewSuggested,
    emptyState: null,
  };
}
