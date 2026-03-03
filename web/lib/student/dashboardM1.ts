import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  careerOfferings,
  careers,
  studentGoals,
  studentGoalScores,
  universities,
  users,
} from "@/db/schema";
import {
  analyzeLearningPotential,
  calculatePAESImprovement,
  type StudentLearningAnalysis,
} from "@/lib/diagnostic/questionUnlock";
import { buildNextActionInsights } from "@/lib/student/nextAction";

const DEFAULT_FORECAST_WEEKS = 8;
const DEFAULT_WEEKLY_MINUTES = 360;

type DashboardStatus =
  | "ready"
  | "missing_diagnostic"
  | "missing_target"
  | "missing_mastery";

type ConfidenceLevel = "low" | "medium" | "high";

type StudentM1Target = {
  score: number;
  goalLabel: string;
};

type MasteryRow = {
  atomId: string;
  isMastered: boolean;
};

export type M1DashboardData = {
  status: DashboardStatus;
  current: {
    score: number | null;
    min: number | null;
    max: number | null;
  };
  target: {
    score: number | null;
    gapPoints: number | null;
    goalLabel: string | null;
  };
  prediction: {
    min: number | null;
    max: number | null;
  };
  confidence: {
    level: ConfidenceLevel;
    score: number;
    bandWidth: number | null;
    masteredAtoms: number;
    totalAtoms: number;
    masteryPercentage: number;
  };
  effort: {
    estimatedMinutesToTarget: number | null;
    topRoute: {
      axis: string;
      pointsGain: number;
      studyMinutes: number;
    } | null;
    model: {
      forecastWeeks: number;
      recommendedWeeklyMinutes: number;
      minutesPerPoint: number | null;
      minutesPerTenPoints: number | null;
    };
  };
  emptyState: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clampScore(value: number): number {
  return Math.max(100, Math.min(1000, Math.round(value)));
}

function defaultEffortModel() {
  return {
    forecastWeeks: DEFAULT_FORECAST_WEEKS,
    recommendedWeeklyMinutes: DEFAULT_WEEKLY_MINUTES,
    minutesPerPoint: null,
    minutesPerTenPoints: null,
  };
}

function computeConfidence(params: {
  masteryRatio: number;
  bandWidth: number;
}): { level: ConfidenceLevel; score: number } {
  const masteryComponent = Math.max(0, Math.min(1, params.masteryRatio));
  const bandComponent = Math.max(0, Math.min(1, 1 - params.bandWidth / 250));
  const score = Math.round(
    (masteryComponent * 0.65 + bandComponent * 0.35) * 100
  );

  if (score >= 70) {
    return { level: "high", score };
  }
  if (score >= 40) {
    return { level: "medium", score };
  }

  return { level: "low", score };
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

async function getStudentM1Target(
  userId: string
): Promise<StudentM1Target | null> {
  const rows = await db
    .select({
      score: studentGoalScores.score,
      priority: studentGoals.priority,
      careerName: careers.name,
      universityName: universities.name,
    })
    .from(studentGoals)
    .innerJoin(studentGoalScores, eq(studentGoalScores.goalId, studentGoals.id))
    .innerJoin(careerOfferings, eq(careerOfferings.id, studentGoals.offeringId))
    .innerJoin(careers, eq(careers.id, careerOfferings.careerId))
    .innerJoin(universities, eq(universities.id, careerOfferings.universityId))
    .where(
      and(
        eq(studentGoals.userId, userId),
        eq(studentGoals.isPrimary, true),
        eq(studentGoalScores.testCode, "M1")
      )
    )
    .orderBy(studentGoals.priority)
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const parsedScore = Number(row.score);
  if (!Number.isFinite(parsedScore)) {
    return null;
  }

  return {
    score: parsedScore,
    goalLabel: `Meta ${row.priority}: ${row.careerName} — ${row.universityName}`,
  };
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

function buildEmptyState(
  status: DashboardStatus
): M1DashboardData["emptyState"] {
  if (status === "missing_diagnostic") {
    return {
      title: "Completa tu diagnóstico M1",
      description:
        "Necesitamos tu diagnóstico para estimar tu nivel actual, brecha y esfuerzo recomendado.",
      ctaLabel: "Ir al diagnóstico",
      ctaHref: "/diagnostico",
    };
  }

  if (status === "missing_target") {
    return {
      title: "Define tu meta M1",
      description:
        "Agrega un puntaje objetivo M1 en tus metas para activar la brecha y el plan de esfuerzo.",
      ctaLabel: "Configurar metas",
      ctaHref: "/portal/goals",
    };
  }

  if (status === "missing_mastery") {
    return {
      title: "Aún no hay señal de aprendizaje",
      description:
        "Todavía no encontramos registros de dominio por átomo para calcular una proyección confiable.",
      ctaLabel: "Ir al diagnóstico",
      ctaHref: "/diagnostico",
    };
  }

  return null;
}

function buildMissingDashboard(params: {
  status: Exclude<DashboardStatus, "ready">;
  current: { score: number | null; min: number | null; max: number | null };
  target: StudentM1Target | null;
  bandWidth: number | null;
}): M1DashboardData {
  return {
    status: params.status,
    current: params.current,
    target: {
      score: params.target?.score ?? null,
      gapPoints: null,
      goalLabel: params.target?.goalLabel ?? null,
    },
    prediction: { min: null, max: null },
    confidence: {
      level: "low",
      score: 0,
      bandWidth: params.bandWidth,
      masteredAtoms: 0,
      totalAtoms: 0,
      masteryPercentage: 0,
    },
    effort: {
      estimatedMinutesToTarget: null,
      topRoute: null,
      model: defaultEffortModel(),
    },
    emptyState: buildEmptyState(params.status),
  };
}

function computeEffortMetrics(params: {
  currentScore: number;
  targetScore: number;
  analysis: StudentLearningAnalysis;
}) {
  const insights = buildNextActionInsights(params.analysis);
  const topRoutes = insights.topRoutes.slice(0, 3);
  const totalPotentialUnlocks = topRoutes.reduce(
    (sum, route) => sum + route.totalQuestionsUnlocked,
    0
  );
  const improvement = calculatePAESImprovement(
    params.currentScore,
    totalPotentialUnlocks
  );
  const topRoute = insights.nextAction;

  const gapPointsRaw = params.targetScore - params.currentScore;
  const gapPoints = gapPointsRaw > 0 ? Math.round(gapPointsRaw) : 0;

  const topRouteMinutes = topRoute ? Math.round(topRoute.studyMinutes) : null;
  const topRoutePoints = topRoute ? topRoute.pointsGain : null;

  const minutesPerPointRaw =
    topRouteMinutes !== null && topRoutePoints !== null && topRoutePoints > 0
      ? topRouteMinutes / topRoutePoints
      : null;

  const minutesPerPoint =
    minutesPerPointRaw !== null && minutesPerPointRaw > 0
      ? round1(minutesPerPointRaw)
      : null;

  const minutesPerTenPoints =
    minutesPerPointRaw !== null && minutesPerPointRaw > 0
      ? round1(minutesPerPointRaw * 10)
      : null;

  const estimatedMinutesToTarget =
    gapPoints === 0
      ? 0
      : minutesPerPointRaw !== null
        ? Math.round(gapPoints * minutesPerPointRaw)
        : null;

  return {
    prediction: {
      min: clampScore(params.currentScore + improvement.minPoints),
      max: clampScore(params.currentScore + improvement.maxPoints),
    },
    gapPoints,
    estimatedMinutesToTarget,
    minutesPerPoint,
    minutesPerTenPoints,
    topRoute,
  };
}

function buildReadyDashboard(params: {
  currentScore: number;
  minScore: number;
  maxScore: number;
  target: StudentM1Target;
  analysis: StudentLearningAnalysis;
}): M1DashboardData {
  const effortMetrics = computeEffortMetrics({
    currentScore: params.currentScore,
    targetScore: params.target.score,
    analysis: params.analysis,
  });

  const masteryRatio =
    params.analysis.summary.totalAtoms > 0
      ? params.analysis.summary.masteredAtoms /
        params.analysis.summary.totalAtoms
      : 0;

  const confidence = computeConfidence({
    masteryRatio,
    bandWidth: params.maxScore - params.minScore,
  });

  return {
    status: "ready",
    current: {
      score: params.currentScore,
      min: params.minScore,
      max: params.maxScore,
    },
    target: {
      score: params.target.score,
      gapPoints: effortMetrics.gapPoints,
      goalLabel: params.target.goalLabel,
    },
    prediction: effortMetrics.prediction,
    confidence: {
      level: confidence.level,
      score: confidence.score,
      bandWidth: params.maxScore - params.minScore,
      masteredAtoms: params.analysis.summary.masteredAtoms,
      totalAtoms: params.analysis.summary.totalAtoms,
      masteryPercentage: Math.round(masteryRatio * 100),
    },
    effort: {
      estimatedMinutesToTarget: effortMetrics.estimatedMinutesToTarget,
      topRoute: effortMetrics.topRoute
        ? {
            axis: effortMetrics.topRoute.axis,
            pointsGain: effortMetrics.topRoute.pointsGain,
            studyMinutes: effortMetrics.topRoute.studyMinutes,
          }
        : null,
      model: {
        forecastWeeks: DEFAULT_FORECAST_WEEKS,
        recommendedWeeklyMinutes: DEFAULT_WEEKLY_MINUTES,
        minutesPerPoint: effortMetrics.minutesPerPoint,
        minutesPerTenPoints: effortMetrics.minutesPerTenPoints,
      },
    },
    emptyState: null,
  };
}

export async function getM1Dashboard(userId: string): Promise<M1DashboardData> {
  const [snapshot, target, masteryRows] = await Promise.all([
    getUserDiagnosticSnapshot(userId),
    getStudentM1Target(userId),
    getMasteryRows(userId),
  ]);

  const minScore = snapshot?.paesScoreMin ?? null;
  const maxScore = snapshot?.paesScoreMax ?? null;
  const hasDiagnostic = minScore !== null && maxScore !== null;

  if (!hasDiagnostic) {
    return buildMissingDashboard({
      status: "missing_diagnostic",
      current: { score: null, min: minScore, max: maxScore },
      target,
      bandWidth: null,
    });
  }

  const currentScore = Math.round((minScore + maxScore) / 2);

  if (!target) {
    return buildMissingDashboard({
      status: "missing_target",
      current: { score: currentScore, min: minScore, max: maxScore },
      target: null,
      bandWidth: maxScore - minScore,
    });
  }

  if (masteryRows.length === 0) {
    return buildMissingDashboard({
      status: "missing_mastery",
      current: { score: currentScore, min: minScore, max: maxScore },
      target,
      bandWidth: maxScore - minScore,
    });
  }

  const analysis = await analyzeLearningPotential(
    masteryRows.map((row) => ({
      atomId: row.atomId,
      mastered: row.isMastered,
    })),
    { currentPaesScore: currentScore }
  );

  return buildReadyDashboard({
    currentScore,
    minScore,
    maxScore,
    target,
    analysis,
  });
}
