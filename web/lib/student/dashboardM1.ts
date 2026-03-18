import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  careerOfferings,
  careers,
  studentGoals,
  studentGoalScores,
  studentScoreTargets,
  universities,
} from "@/db/schema";
import { getUserDiagnosticSnapshot, getMasteryRows } from "./userQueries";
import { getScoreHistory } from "./scoreHistory";
import { resolveDisplayScore } from "./scoreDisplay";
import {
  analyzeLearningPotential,
  calculatePAESImprovement,
  type StudentLearningAnalysis,
} from "@/lib/diagnostic/questionUnlock";
import {
  PAES_TOTAL_QUESTIONS,
  normalizeToTestSize,
} from "@/lib/diagnostic/paesScoreTable";
import { buildNextActionInsights } from "@/lib/student/nextAction";
import {
  getRetestStatus,
  hasCompletedFullTest,
  type RetestStatus,
} from "@/lib/student/retestGating";
import { getStudentMetrics } from "@/lib/student/metricsService";

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

export type DiagnosticSource = "short_diagnostic" | "full_test";

export type M1DashboardData = {
  status: DashboardStatus;
  current: {
    score: number | null;
    min: number | null;
    max: number | null;
    isPersonalBest: boolean;
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
    questionsUnlocked: number;
    totalOfficialQuestions: number;
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
  diagnosticSource: DiagnosticSource;
  retestStatus: RetestStatus | null;
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
  diagnosticSource: DiagnosticSource;
}): { level: ConfidenceLevel; score: number } {
  const masteryComponent = Math.max(0, Math.min(1, params.masteryRatio));
  const bandComponent = Math.max(0, Math.min(1, 1 - params.bandWidth / 250));
  const score = Math.round(
    (masteryComponent * 0.65 + bandComponent * 0.35) * 100
  );

  const isShortDiagnosticOnly = params.diagnosticSource !== "full_test";

  if (score >= 70 && !isShortDiagnosticOnly) {
    return { level: "high", score };
  }
  if (score >= 40) {
    return { level: "medium", score };
  }

  return { level: "low", score };
}

async function getStudentM1Target(
  userId: string
): Promise<StudentM1Target | null> {
  // Try new student-centric score targets first
  const [targetRow] = await db
    .select({ score: studentScoreTargets.score })
    .from(studentScoreTargets)
    .where(
      and(
        eq(studentScoreTargets.userId, userId),
        eq(studentScoreTargets.testCode, "M1")
      )
    )
    .limit(1);

  if (targetRow) {
    const parsed = Number(targetRow.score);
    if (Number.isFinite(parsed)) {
      return { score: parsed, goalLabel: "Tu objetivo M1" };
    }
  }

  // Fallback to legacy per-career goal scores for existing users
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
  if (!row) return null;

  const parsedScore = Number(row.score);
  if (!Number.isFinite(parsedScore)) return null;

  return {
    score: parsedScore,
    goalLabel: `${row.careerName} — ${row.universityName}`,
  };
}

const EMPTY_STATES: Record<string, M1DashboardData["emptyState"]> = {
  missing_diagnostic: {
    title: "Activa planificación y diagnóstico",
    description:
      "Primero define tu meta y compromiso semanal para iniciar el diagnóstico con foco.",
    ctaLabel: "Ir a planificación",
    ctaHref: "/portal/goals?mode=planning",
  },
  missing_target: {
    title: "Define tu objetivo M1",
    description:
      "Agrega un puntaje objetivo M1 en Mis Objetivos para activar la brecha y el plan de esfuerzo.",
    ctaLabel: "Configurar objetivos",
    ctaHref: "/portal/goals",
  },
  missing_mastery: {
    title: "Aún no hay señal de aprendizaje",
    description:
      "Todavía no encontramos registros de dominio por átomo para calcular una proyección confiable.",
    ctaLabel: "Comenzar estudio",
    ctaHref: "/portal/study",
  },
};

function buildMissingDashboard(params: {
  status: Exclude<DashboardStatus, "ready">;
  current: M1DashboardData["current"];
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
      questionsUnlocked: 0,
      totalOfficialQuestions: PAES_TOTAL_QUESTIONS,
    },
    effort: {
      estimatedMinutesToTarget: null,
      topRoute: null,
      model: defaultEffortModel(),
    },
    diagnosticSource: "short_diagnostic",
    retestStatus: null,
    emptyState: EMPTY_STATES[params.status] ?? null,
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
    totalPotentialUnlocks,
    params.analysis.summary.totalQuestions
  );
  const topRoute = insights.nextAction;
  const gapPoints = Math.max(
    0,
    Math.round(params.targetScore - params.currentScore)
  );
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
    estimatedMinutesToTarget,
    minutesPerPoint,
    minutesPerTenPoints,
    topRoute,
  };
}

function buildReadyDashboard(params: {
  displayScore: number;
  displayMin: number;
  displayMax: number;
  isPersonalBest: boolean;
  latestScore: number;
  latestMin: number;
  latestMax: number;
  target: StudentM1Target;
  analysis: StudentLearningAnalysis;
  metrics: {
    masteredAtoms: number;
    totalRelevantAtoms: number;
    masteryPercentage: number;
    questionsUnlocked: number;
    totalOfficialQuestions: number;
  };
  diagnosticSource: DiagnosticSource;
  retestStatus: RetestStatus | null;
}): M1DashboardData {
  // Effort uses the latest score for honest internal projections
  const effortMetrics = computeEffortMetrics({
    currentScore: params.latestScore,
    targetScore: params.target.score,
    analysis: params.analysis,
  });

  const masteryRatio =
    params.metrics.totalRelevantAtoms > 0
      ? params.metrics.masteredAtoms / params.metrics.totalRelevantAtoms
      : 0;

  const confidence = computeConfidence({
    masteryRatio,
    bandWidth: params.latestMax - params.latestMin,
    diagnosticSource: params.diagnosticSource,
  });

  // Gap uses the displayed (personal best) score for the student-facing metric
  const gapPoints = Math.max(
    0,
    Math.round(params.target.score - params.displayScore)
  );

  return {
    status: "ready",
    current: {
      score: params.displayScore,
      min: params.displayMin,
      max: params.displayMax,
      isPersonalBest: params.isPersonalBest,
    },
    target: {
      score: params.target.score,
      gapPoints,
      goalLabel: params.target.goalLabel,
    },
    prediction: effortMetrics.prediction,
    confidence: {
      level: confidence.level,
      score: confidence.score,
      bandWidth: params.latestMax - params.latestMin,
      masteredAtoms: params.metrics.masteredAtoms,
      totalAtoms: params.metrics.totalRelevantAtoms,
      masteryPercentage: params.metrics.masteryPercentage,
      questionsUnlocked: Math.round(
        normalizeToTestSize(
          params.metrics.questionsUnlocked,
          params.metrics.totalOfficialQuestions
        )
      ),
      totalOfficialQuestions: PAES_TOTAL_QUESTIONS,
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
    diagnosticSource: params.diagnosticSource,
    retestStatus: params.retestStatus,
    emptyState: null,
  };
}

export async function getM1Dashboard(userId: string): Promise<M1DashboardData> {
  const [snapshot, target, masteryRows, scoreHistory] = await Promise.all([
    getUserDiagnosticSnapshot(userId),
    getStudentM1Target(userId),
    getMasteryRows(userId),
    getScoreHistory(userId),
  ]);

  const latestMin = snapshot?.paesScoreMin ?? null;
  const latestMax = snapshot?.paesScoreMax ?? null;
  const hasDiagnostic = latestMin !== null && latestMax !== null;

  if (!hasDiagnostic) {
    return buildMissingDashboard({
      status: "missing_diagnostic",
      current: {
        score: null,
        min: latestMin,
        max: latestMax,
        isPersonalBest: false,
      },
      target,
      bandWidth: null,
    });
  }

  const latestScore = Math.round((latestMin + latestMax) / 2);

  const display = resolveDisplayScore(
    { paesScoreMin: latestMin, paesScoreMax: latestMax },
    scoreHistory
  );
  const displayScore = display.score;
  const displayMin = display.min;
  const displayMax = display.max;
  const isPersonalBest = display.isPersonalBest;

  if (!target) {
    return buildMissingDashboard({
      status: "missing_target",
      current: {
        score: displayScore,
        min: displayMin,
        max: displayMax,
        isPersonalBest,
      },
      target: null,
      bandWidth: latestMax - latestMin,
    });
  }

  if (masteryRows.length === 0) {
    return buildMissingDashboard({
      status: "missing_mastery",
      current: {
        score: displayScore,
        min: displayMin,
        max: displayMax,
        isPersonalBest,
      },
      target,
      bandWidth: latestMax - latestMin,
    });
  }

  const [analysis, retestStatus, metrics, hasFullTest] = await Promise.all([
    analyzeLearningPotential(
      masteryRows.map((row) => ({
        atomId: row.atomId,
        mastered: row.isMastered,
      })),
      { currentPaesScore: latestScore }
    ),
    getRetestStatus(userId),
    getStudentMetrics(userId),
    hasCompletedFullTest(userId),
  ]);

  const diagnosticSource: DiagnosticSource = hasFullTest
    ? "full_test"
    : "short_diagnostic";

  return buildReadyDashboard({
    displayScore,
    displayMin,
    displayMax,
    isPersonalBest,
    latestScore,
    latestMin,
    latestMax,
    target,
    analysis,
    metrics,
    diagnosticSource,
    retestStatus,
  });
}
