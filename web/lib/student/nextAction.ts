import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atomMastery, users } from "@/db/schema";
import {
  analyzeLearningPotential,
  type StudentLearningAnalysis,
} from "@/lib/diagnostic/questionUnlock";

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

export type NextActionInsights = {
  topRoutes: StudentLearningAnalysis["routes"];
  nextAction: NextActionItem | null;
  queuePreview: QueuePreviewItem[];
};

export type StudentNextActionData = {
  status: NextActionStatus;
  nextAction: NextActionItem | null;
  queuePreview: QueuePreviewItem[];
  emptyState: NextActionEmptyState;
};

type MasteryRow = {
  atomId: string;
  isMastered: boolean;
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
  };
}

function buildEmptyState(status: Exclude<NextActionStatus, "ready">) {
  if (status === "missing_diagnostic") {
    return {
      title: "Completa tu diagnóstico M1",
      description:
        "Necesitamos tu diagnóstico para recomendar la mejor acción de estudio.",
      ctaLabel: "Ir al diagnóstico",
      ctaHref: "/diagnostico",
    };
  }

  return {
    title: "Aún no hay señal de aprendizaje",
    description:
      "Todavía no hay registros de dominio por átomo para priorizar tu siguiente acción.",
    ctaLabel: "Ir al diagnóstico",
    ctaHref: "/diagnostico",
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
    })
    .from(atomMastery)
    .where(eq(atomMastery.userId, userId));
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
      emptyState: buildEmptyState("missing_diagnostic"),
    };
  }

  if (masteryRows.length === 0) {
    return {
      status: "missing_mastery",
      nextAction: null,
      queuePreview: [],
      emptyState: buildEmptyState("missing_mastery"),
    };
  }

  const currentScore = Math.round((minScore + maxScore) / 2);

  const analysis = await analyzeLearningPotential(
    masteryRows.map((row) => ({
      atomId: row.atomId,
      mastered: row.isMastered,
    })),
    { currentPaesScore: currentScore }
  );

  const insights = buildNextActionInsights(analysis);

  return {
    status: "ready",
    nextAction: insights.nextAction,
    queuePreview: insights.queuePreview,
    emptyState: null,
  };
}
