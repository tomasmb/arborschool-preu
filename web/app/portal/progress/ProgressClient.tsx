"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageShell, ErrorStatePanel } from "@/app/portal/components";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";
import { resolveApiErrorMessage } from "@/lib/student/apiClientEnvelope";
import { MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";
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
  ProjectionResult,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const ATOMS_STEPS = [2, 5, 10, 15, 20];

const HERO_GRADIENT = "linear-gradient(90deg, #0b3a5b, #134b73, #059669)";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressClient() {
  const { data, loading, error, atomsPerWeek, setAtomsPerWeek } =
    useProgressData();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(
    null
  );

  const milestones = data?.goalMilestones ?? [];
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

          <ScoreJourneyChart
            history={data.scoreHistory}
            projection={data.projection.points}
            milestones={selectedMilestones}
            currentScore={data.currentScore}
            diagnosticCeiling={data.projection.diagnosticCeiling}
          />

          <ProjectionCard
            projection={data.projection}
            atomsPerWeek={atomsPerWeek}
            onChangeAtomsPerWeek={setAtomsPerWeek}
            allAtomsMastered={
              data.masteryBreakdown.mastered >= data.masteryBreakdown.total
            }
            selectedMeta={selectedMeta}
          />

          <AxisBreakdownSection axisMastery={data.axisMastery} />
          <RetestCTASection retestStatus={data.retestStatus} />
          <TestHistoryTable history={data.scoreHistory} />
        </div>
      ) : null}
    </PageShell>
  );
}

// ============================================================================
// DATA HOOK
// ============================================================================

function useProgressData() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atomsPerWeek, setAtomsPerWeek] = useState<number | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const fetchData = useCallback(async (atoms: number) => {
    try {
      const res = await fetch(`/api/student/progress?atomsPerWeek=${atoms}`, {
        credentials: "include",
      });
      const payload = (await res.json()) as ApiEnvelope<ProgressData>;
      if (!res.ok || !payload.success) {
        throw new Error(
          resolveApiErrorMessage(payload, "Error al cargar progreso")
        );
      }
      if (mountedRef.current) {
        setData(payload.data);

        // Use planning profile default on first load
        if (!initializedRef.current && payload.data.defaultAtomsPerWeek) {
          const closest = findClosestStep(payload.data.defaultAtomsPerWeek);
          setAtomsPerWeek(closest);
          initializedRef.current = true;
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg =
        err instanceof Error ? err.message : "Error al cargar progreso";
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData(atomsPerWeek ?? 10);
    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAtomsChange = useCallback(
    (value: number) => {
      setAtomsPerWeek(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchData(value), 400);
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    atomsPerWeek: atomsPerWeek ?? 10,
    setAtomsPerWeek: handleAtomsChange,
  };
}

/** Snap an arbitrary atoms-per-week value to the nearest ATOMS_STEPS. */
function findClosestStep(value: number): number {
  let best = ATOMS_STEPS[0];
  let bestDist = Math.abs(value - best);
  for (const step of ATOMS_STEPS) {
    const dist = Math.abs(value - step);
    if (dist < bestDist) {
      best = step;
      bestDist = dist;
    }
  }
  return best;
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
              <span className="text-2xl font-bold text-gray-900">{pct}%</span>
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
  atomsPerWeek,
  onChangeAtomsPerWeek,
  allAtomsMastered,
  selectedMeta,
}: {
  projection: ProjectionResult;
  atomsPerWeek: number;
  onChangeAtomsPerWeek: (value: number) => void;
  allAtomsMastered: boolean;
  selectedMeta: number | null;
}) {
  const minutesPerWeek = atomsPerWeek * MINUTES_PER_ATOM;
  const hoursPerWeek = (minutesPerWeek / 60).toFixed(1);
  const displayMeta = selectedMeta ?? projection.targetScore;
  const n = projection.weeksToTarget;
  const lastPoint = projection.points[projection.points.length - 1];
  const projectedScore = lastPoint?.projectedScoreMid ?? null;
  const hasProjection = projection.points.length > 0;

  return (
    <section className="card-section space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Ritmo de estudio
      </h2>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">
          Si estudias <span className="font-semibold">{hoursPerWeek}h</span> por
          semana
          <span className="text-gray-400 text-xs ml-1">
            ({atomsPerWeek} conceptos · {minutesPerWeek} min)
          </span>
        </label>
        <div className="flex items-center gap-2">
          {ATOMS_STEPS.map((step) => {
            const h = ((step * MINUTES_PER_ATOM) / 60).toFixed(1);
            return (
              <button
                key={step}
                type="button"
                onClick={() => onChangeAtomsPerWeek(step)}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  step === atomsPerWeek
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                ].join(" ")}
              >
                {h}h
              </button>
            );
          })}
        </div>
      </div>

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
            Alcanzas tu meta más alta en ~{n} {n === 1 ? "semana" : "semanas"}
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
