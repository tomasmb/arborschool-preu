import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  getUserDiagnosticSnapshot,
  getMasteryRows,
  type DiagnosticSnapshot,
  type MasteryRow,
} from "./userQueries";
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
  type RetestStatus,
} from "@/lib/student/retestGating";
import { getStudentMetrics } from "@/lib/student/metricsService";

/** Pre-fetched data that can be shared across dashboard consumers. */
export type DashboardSharedData = {
  snapshot: DiagnosticSnapshot | null;
  masteryRows: MasteryRow[];
};

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

/**
 * Fetches the student's M1 target score in a single query. Prefers the
 * new student_score_targets row; falls back to the legacy per-career
 * goal scores via a LEFT JOIN chain.
 */
async function getStudentM1Target(
  userId: string
): Promise<StudentM1Target | null> {
  type TargetRow = {
    score: string | null;
    goal_label: string | null;
  };

  const rows = await db.execute<TargetRow>(sql`
    SELECT
      COALESCE(sst.score::text, sgs.score::text) AS score,
      CASE
        WHEN sst.score IS NOT NULL THEN 'Tu objetivo M1'
        ELSE (c.name || ' — ' || u.name)
      END AS goal_label
    FROM (SELECT 1) AS dummy
    LEFT JOIN student_score_targets sst
      ON sst.user_id = ${userId} AND sst.test_code = 'M1'
    LEFT JOIN student_goals sg
      ON sg.user_id = ${userId} AND sg.is_primary = true
    LEFT JOIN student_goal_scores sgs
      ON sgs.goal_id = sg.id AND sgs.test_code = 'M1'
    LEFT JOIN career_offerings co ON co.id = sg.offering_id
    LEFT JOIN careers c ON c.id = co.career_id
    LEFT JOIN universities u ON u.id = co.university_id
    WHERE sst.score IS NOT NULL OR sgs.score IS NOT NULL
    ORDER BY sg.priority NULLS LAST
    LIMIT 1
  `);

  const row = (rows as unknown as TargetRow[])[0];
  if (!row?.score) return null;

  const parsed = Number(row.score);
  if (!Number.isFinite(parsed)) return null;

  return { score: parsed, goalLabel: row.goal_label ?? "Tu objetivo M1" };
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

/**
 * Builds the M1 dashboard using pre-fetched shared data.
 * Avoids redundant DB reads when called alongside getStudentNextAction.
 */
export async function getM1DashboardWithData(
  userId: string,
  shared: DashboardSharedData
): Promise<M1DashboardData> {
  const { snapshot, masteryRows } = shared;

  const [target, scoreHistory] = await Promise.all([
    getStudentM1Target(userId),
    getScoreHistory(userId),
  ]);

  return buildDashboardFromData(
    userId, snapshot, target, masteryRows, scoreHistory
  );
}

/** Standalone entry point — fetches its own data. */
export async function getM1Dashboard(
  userId: string
): Promise<M1DashboardData> {
  const [snapshot, target, masteryRows, scoreHistory] = await Promise.all([
    getUserDiagnosticSnapshot(userId),
    getStudentM1Target(userId),
    getMasteryRows(userId),
    getScoreHistory(userId),
  ]);

  return buildDashboardFromData(
    userId, snapshot, target, masteryRows, scoreHistory
  );
}

async function buildDashboardFromData(
  userId: string,
  snapshot: DiagnosticSnapshot | null,
  target: StudentM1Target | null,
  masteryRows: MasteryRow[],
  scoreHistory: Awaited<ReturnType<typeof getScoreHistory>>
): Promise<M1DashboardData> {
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

  const [analysis, retestStatus, metrics] = await Promise.all([
    analyzeLearningPotential(
      masteryRows.map((row) => ({
        atomId: row.atomId,
        mastered: row.isMastered,
      })),
      { currentPaesScore: latestScore }
    ),
    getRetestStatus(userId),
    getStudentMetrics(userId),
  ]);

  const diagnosticSource: DiagnosticSource = retestStatus.isFirstTest
    ? "short_diagnostic"
    : "full_test";

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
