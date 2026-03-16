"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageShell, ErrorStatePanel } from "@/app/portal/components";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";
import { resolveApiErrorMessage } from "@/lib/student/apiClientEnvelope";
import {
  EFFECTIVE_MINUTES_PER_ATOM,
  IMPROVEMENT_UNCERTAINTY,
  NUM_OFFICIAL_TESTS,
} from "@/lib/diagnostic/scoringConstants";
import {
  PAES_SCORE_TABLE,
  PAES_TOTAL_QUESTIONS,
} from "@/lib/diagnostic/paesScoreTable";
import {
  AxisBreakdownSection,
  GoalMilestonesSection,
  RetestCTASection,
  TestHistoryTable,
} from "./ProgressSections";
import { ScoreJourneyChart } from "./ScoreJourneyChart";
import type {
  CurrentScore,
  GoalMilestone,
  MasteryBreakdown,
  ProgressData,
  ProjectionMetadata,
  ProjectionPoint,
  ProjectionResult,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_HOURS = 0.5;
const MAX_HOURS = 10;
const HOURS_STEP = 0.5;
const DEFAULT_HOURS = 3;
const MAX_PROJECTION_WEEKS = 20;
const UNCERTAINTY_WITHIN_CEILING = IMPROVEMENT_UNCERTAINTY;
const UNCERTAINTY_BEYOND_CEILING = 0.25;

const HERO_GRADIENT = "linear-gradient(90deg, #0b3a5b, #134b73, #059669)";

// ============================================================================
// CLIENT-SIDE PROJECTION
// ============================================================================

/** Look up the PAES score for a given number of correct answers. */
function getPaesScoreLocal(correctAnswers: number): number {
  const clamped = Math.max(
    0,
    Math.min(PAES_TOTAL_QUESTIONS, Math.round(correctAnswers))
  );
  return PAES_SCORE_TABLE[clamped] ?? 100;
}

/**
 * Computes the full projection curve locally from server-provided metadata.
 *
 * Walks the unlock curve at the pace determined by hoursPerWeek:
 *   effectiveAtomsPerWeek = (hoursPerWeek × 60) / effectiveMinPerAtom
 *
 * At each week, interpolates along the unlock curve to find total
 * questions unlocked, then maps to PAES score via the accuracy model.
 */
function computeProjection(
  meta: ProjectionMetadata,
  hoursPerWeek: number
): ProjectionResult {
  const weeklyMinutes = hoursPerWeek * 60;
  const effectiveAtomsPerWeek = weeklyMinutes / meta.effectiveMinPerAtom;
  const ceiling = meta.diagnosticCeiling ?? meta.currentScore;

  const points: ProjectionPoint[] = [];
  let weeksToTarget: number | null = null;

  for (let week = 1; week <= MAX_PROJECTION_WEEKS; week++) {
    const atomsMasteredSoFar = Math.min(
      effectiveAtomsPerWeek * week,
      meta.totalRemainingAtoms
    );

    const questionsUnlocked = interpolateCurve(
      meta.unlockCurve,
      atomsMasteredSoFar
    );

    const unlockedPerTest = questionsUnlocked / NUM_OFFICIAL_TESTS;
    const lockedPerTest = Math.max(
      0,
      PAES_TOTAL_QUESTIONS - unlockedPerTest
    );

    const expectedCorrect = Math.min(
      PAES_TOTAL_QUESTIONS,
      meta.accUnlocked * unlockedPerTest +
        meta.accLocked * lockedPerTest
    );

    const projectedMid = getPaesScoreLocal(Math.round(expectedCorrect));
    const beyondCeiling = projectedMid > ceiling;

    const uncertainty = beyondCeiling
      ? UNCERTAINTY_BEYOND_CEILING
      : UNCERTAINTY_WITHIN_CEILING;
    const band = Math.round(projectedMid * uncertainty);

    points.push({
      week,
      projectedScoreMid: projectedMid,
      projectedScoreMin: Math.max(100, projectedMid - band),
      projectedScoreMax: Math.min(1000, projectedMid + band),
      beyondCeiling,
    });

    if (
      meta.targetScore &&
      weeksToTarget === null &&
      projectedMid >= meta.targetScore
    ) {
      weeksToTarget = week;
    }
  }

  return {
    points,
    weeksToTarget,
    targetScore: meta.targetScore,
    diagnosticCeiling: meta.diagnosticCeiling,
    studyMinutesPerWeek: weeklyMinutes,
  };
}

/**
 * Linearly interpolates the unlock curve at a fractional atom count.
 * The curve maps integer atom counts to questions unlocked; this
 * returns a smooth value for non-integer positions.
 */
function interpolateCurve(
  curve: ProjectionMetadata["unlockCurve"],
  atomsMastered: number
): number {
  if (curve.length === 0) return 0;
  if (atomsMastered <= 0) return curve[0].questionsUnlocked;
  if (atomsMastered >= curve[curve.length - 1].atomsMastered) {
    return curve[curve.length - 1].questionsUnlocked;
  }

  const floor = Math.floor(atomsMastered);
  const ceil = Math.ceil(atomsMastered);
  const fraction = atomsMastered - floor;

  const floorEntry = curve[floor] ?? curve[curve.length - 1];
  const ceilEntry = curve[ceil] ?? curve[curve.length - 1];

  return (
    floorEntry.questionsUnlocked +
    fraction * (ceilEntry.questionsUnlocked - floorEntry.questionsUnlocked)
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressClient() {
  const { data, loading, error, hoursPerWeek, setHoursPerWeek } =
    useProgressData();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(
    null
  );

  const projection = useMemo(() => {
    if (!data?.projectionMetadata) return null;
    return computeProjection(data.projectionMetadata, hoursPerWeek);
  }, [data?.projectionMetadata, hoursPerWeek]);

  const milestones = useMemo(() => {
    if (!data || !projection) return data?.goalMilestones ?? [];
    return enrichMilestonesWithWeeks(data.goalMilestones, projection.points);
  }, [data, projection]);

  const effectiveGoalId =
    selectedGoalId ??
    milestones.find((m) => m.isPrimary)?.goalId ??
    milestones[0]?.goalId ??
    null;

  const selectedMilestones: GoalMilestone[] = effectiveGoalId
    ? milestones.filter((m) => m.goalId === effectiveGoalId)
    : [];

  const selectedMeta = selectedMilestones[0]?.userM1Target ?? null;

  return (
    <PageShell
      title="Tu progreso"
      subtitle="Dominio de conceptos, proyección y tests"
    >
      {loading ? (
        <ProgressSkeleton />
      ) : error ? (
        <ErrorStatePanel message={error} />
      ) : data ? (
        <div className="space-y-6">
          <MasteryHeroSection
            breakdown={data.masteryBreakdown}
            currentScore={data.currentScore}
          />

          <GoalMilestonesSection
            milestones={milestones}
            currentScore={data.currentScore}
            selectedGoalId={effectiveGoalId}
            onSelectGoal={setSelectedGoalId}
          />

          {projection && (
            <ScoreJourneyChart
              history={data.scoreHistory}
              projection={projection.points}
              milestones={selectedMilestones}
              currentScore={data.currentScore}
              diagnosticCeiling={projection.diagnosticCeiling}
            />
          )}

          {projection && (
            <ProjectionCard
              projection={projection}
              hoursPerWeek={hoursPerWeek}
              onChangeHours={setHoursPerWeek}
              allAtomsMastered={
                data.masteryBreakdown.mastered >=
                data.masteryBreakdown.total
              }
              selectedMeta={selectedMeta}
            />
          )}

          <AxisBreakdownSection axisMastery={data.axisMastery} />
          <RetestCTASection retestStatus={data.retestStatus} />
          <TestHistoryTable history={data.scoreHistory} />
        </div>
      ) : null}
    </PageShell>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function enrichMilestonesWithWeeks(
  milestones: GoalMilestone[],
  points: ProjectionPoint[]
): GoalMilestone[] {
  return milestones.map((m) => {
    const target = m.userM1Target;
    if (target === null) return { ...m, weeksToReach: null };
    const point = points.find((p) => p.projectedScoreMid >= target);
    return { ...m, weeksToReach: point?.week ?? null };
  });
}

// ============================================================================
// DATA HOOK
// ============================================================================

/** Fire-and-forget PATCH to persist the student's M1 study hours. */
async function persistHours(weeklyMinutes: number) {
  try {
    await fetch("/api/student/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testCode: "M1", weeklyMinutes }),
    });
  } catch {
    // Best-effort — slider still works locally even if persist fails.
  }
}

function useProgressData() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoursPerWeek, setHoursRaw] = useState(DEFAULT_HOURS);
  const mountedRef = useRef(true);
  const persistRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/student/progress", {
          credentials: "include",
        });
        const payload = (await res.json()) as ApiEnvelope<ProgressData>;
        if (!res.ok || !payload.success) {
          throw new Error(
            resolveApiErrorMessage(payload, "Error al cargar progreso")
          );
        }
        if (!mountedRef.current) return;

        setData(payload.data);

        const profileAtoms = payload.data.defaultAtomsPerWeek;
        if (profileAtoms) {
          const profileHours = atomsToHours(profileAtoms);
          setHoursRaw(profileHours);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setError(
          err instanceof Error ? err.message : "Error al cargar progreso"
        );
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleHoursChange = useCallback((hours: number) => {
    const clamped = Math.min(MAX_HOURS, Math.max(MIN_HOURS, hours));
    setHoursRaw(clamped);
    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => {
      void persistHours(Math.round(clamped * 60));
    }, 1000);
  }, []);

  return {
    data,
    loading,
    error,
    hoursPerWeek,
    setHoursPerWeek: handleHoursChange,
  };
}

function atomsToHours(atoms: number): number {
  const raw = (atoms * EFFECTIVE_MINUTES_PER_ATOM) / 60;
  return Math.round(raw / HOURS_STEP) * HOURS_STEP;
}

// ============================================================================
// MASTERY HERO
// ============================================================================

function MasteryHeroSection({
  breakdown,
  currentScore,
}: {
  breakdown: MasteryBreakdown;
  currentScore: CurrentScore | null;
}) {
  const pct =
    breakdown.total > 0
      ? Math.round((breakdown.mastered / breakdown.total) * 100)
      : 0;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white
        overflow-hidden"
    >
      <div className="h-[3px]" style={{ background: HERO_GRADIENT }} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <svg width={136} height={136} className="-rotate-90">
              <circle
                cx={68}
                cy={68}
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={10}
              />
              <circle
                cx={68}
                cy={68}
                r={radius}
                fill="none"
                stroke="#059669"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div
              className="absolute inset-0 flex flex-col items-center
                justify-center"
            >
              <span className="text-2xl font-bold text-gray-900">
                {pct}%
              </span>
              <span className="text-[11px] text-gray-500">dominado</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h2 className="text-lg font-serif font-semibold text-primary">
              {breakdown.mastered} / {breakdown.total} conceptos
            </h2>

            <div
              className="flex flex-wrap justify-center sm:justify-start
                gap-2"
            >
              <StatusBadge
                label="Dominados"
                count={breakdown.mastered}
                color="emerald"
              />
              <StatusBadge
                label="En progreso"
                count={breakdown.inProgress}
                color="amber"
              />
              {breakdown.needsVerification > 0 && (
                <StatusBadge
                  label="Por verificar"
                  count={breakdown.needsVerification}
                  color="rose"
                />
              )}
              <StatusBadge
                label="Sin iniciar"
                count={breakdown.notStarted}
                color="gray"
              />
            </div>

            <div
              className="flex flex-wrap justify-center sm:justify-start
                gap-x-4 gap-y-1 text-sm text-gray-600"
            >
              {currentScore && (
                <p>
                  Tu puntaje demostrado:{" "}
                  <span className="font-semibold text-primary">
                    {currentScore.mid}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({currentScore.min}–{currentScore.max})
                  </span>
                  {currentScore.isPersonalBest && (
                    <span className="text-xs text-emerald-600 ml-1">
                      (mejor resultado)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const BADGE_COLORS: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  gray: "bg-gray-100 text-gray-600",
};

function StatusBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5
        py-0.5 text-xs font-medium
        ${BADGE_COLORS[color] ?? BADGE_COLORS.gray}`}
    >
      {count} {label}
    </span>
  );
}

// ============================================================================
// PROJECTION CARD
// ============================================================================

function ProjectionCard({
  projection,
  hoursPerWeek,
  onChangeHours,
  allAtomsMastered,
  selectedMeta,
}: {
  projection: ProjectionResult;
  hoursPerWeek: number;
  onChangeHours: (value: number) => void;
  allAtomsMastered: boolean;
  selectedMeta: number | null;
}) {
  const minutesPerWeek = Math.round(hoursPerWeek * 60);
  const displayMeta = selectedMeta ?? projection.targetScore;
  const n = projection.weeksToTarget;
  const lastPoint = projection.points[projection.points.length - 1];
  const projectedScore = lastPoint?.projectedScoreMid ?? null;
  const hasProjection = projection.points.length > 0;

  const atMin = hoursPerWeek <= MIN_HOURS;
  const atMax = hoursPerWeek >= MAX_HOURS;

  return (
    <section className="card-section space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Ritmo de estudio
      </h2>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">
          Horas por semana
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={atMin}
            onClick={() => onChangeHours(hoursPerWeek - HOURS_STEP)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg",
              "text-lg font-semibold transition",
              atMin
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
            aria-label="Reducir horas"
          >
            −
          </button>

          <span className="min-w-[3.5rem] text-center text-lg font-semibold">
            {hoursPerWeek.toFixed(1)}h
          </span>

          <button
            type="button"
            disabled={atMax}
            onClick={() => onChangeHours(hoursPerWeek + HOURS_STEP)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg",
              "text-lg font-semibold transition",
              atMax
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
            aria-label="Aumentar horas"
          >
            +
          </button>
        </div>

        <p className="text-xs text-gray-400">{minutesPerWeek} min/semana</p>
      </div>

      <div className="space-y-4">
        {allAtomsMastered ? (
          <div
            className="rounded-xl bg-emerald-50 border border-emerald-100
              px-4 py-3"
          >
            <p className="text-sm font-medium text-emerald-800">
              ¡Has dominado todos los conceptos!
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Toma un test completo para validar tu puntaje final.
            </p>
          </div>
        ) : n ? (
          <div
            className="rounded-xl bg-emerald-50 border border-emerald-100
              px-4 py-3"
          >
            <p className="text-sm font-medium text-emerald-800">
              Alcanzas tu meta más alta en ~{n}{" "}
              {n === 1 ? "semana" : "semanas"}
            </p>
            {displayMeta && projectedScore && (
              <p className="text-xs text-emerald-600 mt-0.5">
                Puntaje proyectado a {projection.points.length} semanas:{" "}
                {projectedScore} (meta: {displayMeta})
              </p>
            )}
          </div>
        ) : hasProjection && projectedScore ? (
          <p className="text-sm text-gray-600">
            Puntaje proyectado a {projection.points.length} semanas:{" "}
            <span className="font-semibold">{projectedScore}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Completa un diagnóstico para ver tu proyección.
          </p>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card-section animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-48 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
