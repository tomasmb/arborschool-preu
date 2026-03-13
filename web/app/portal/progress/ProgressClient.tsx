"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageShell, ErrorStatePanel } from "@/app/portal/components";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";
import { resolveApiErrorMessage } from "@/lib/student/apiClientEnvelope";
import { MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";
import { RetestCTASection, TestHistoryTable } from "./ProgressSections";
import type {
  AxisMasteryItem,
  MasteryBreakdown,
  ProgressData,
  ProjectionResult,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const ATOMS_STEPS = [2, 5, 10, 15, 20];

const HERO_GRADIENT =
  "linear-gradient(90deg, #0b3a5b, #134b73, #059669)";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressClient() {
  const { data, loading, error, atomsPerWeek, setAtomsPerWeek } =
    useProgressData();

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
            personalBest={data.personalBest}
            currentScore={data.currentScore}
          />
          <AxisBreakdownSection axisMastery={data.axisMastery} />
          <ProjectionCard
            projection={data.projection}
            targetScore={data.targetScore}
            atomsPerWeek={atomsPerWeek}
            onChangeAtomsPerWeek={setAtomsPerWeek}
          />
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
  const [atomsPerWeek, setAtomsPerWeek] = useState(10);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

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
      if (mountedRef.current) setData(payload.data);
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
    fetchData(atomsPerWeek);
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
    atomsPerWeek,
    setAtomsPerWeek: handleAtomsChange,
  };
}

// ============================================================================
// MASTERY HERO (matches DashboardHeroSection accent-bar pattern)
// ============================================================================

function MasteryHeroSection({
  breakdown,
  personalBest,
  currentScore,
}: {
  breakdown: MasteryBreakdown;
  personalBest: number | null;
  currentScore: { min: number; max: number; mid: number } | null;
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
                  Puntaje actual:{" "}
                  <span className="font-semibold text-primary">
                    {currentScore.mid}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({currentScore.min}–{currentScore.max})
                  </span>
                </p>
              )}
              {personalBest != null && (
                <p>
                  Mejor:{" "}
                  <span className="font-semibold text-primary">
                    {personalBest}
                  </span>
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
// AXIS BREAKDOWN
// ============================================================================

const AXIS_CARD_COLORS: Record<string, { bg: string; bar: string }> = {
  ALG: { bg: "bg-indigo-50 border-indigo-100", bar: "bg-indigo-500" },
  NUM: { bg: "bg-amber-50 border-amber-100", bar: "bg-amber-500" },
  GEO: { bg: "bg-emerald-50 border-emerald-100", bar: "bg-emerald-500" },
  PROB: { bg: "bg-rose-50 border-rose-100", bar: "bg-rose-500" },
};

function AxisBreakdownSection({
  axisMastery,
}: {
  axisMastery: AxisMasteryItem[];
}) {
  if (axisMastery.length === 0) return null;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {axisMastery.map((axis) => {
        const pct =
          axis.total > 0
            ? Math.round((axis.mastered / axis.total) * 100)
            : 0;
        const colors =
          AXIS_CARD_COLORS[axis.axisCode] ?? AXIS_CARD_COLORS.ALG;

        return (
          <div
            key={axis.axisCode}
            className={`rounded-xl border p-4 ${colors.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-800">
                {axis.label}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {axis.mastered}/{axis.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/60 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors.bar}
                  transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {pct}% dominado
            </p>
          </div>
        );
      })}
    </section>
  );
}

// ============================================================================
// PROJECTION CARD
// ============================================================================

function ProjectionCard({
  projection,
  targetScore,
  atomsPerWeek,
  onChangeAtomsPerWeek,
}: {
  projection: ProjectionResult;
  targetScore: number | null;
  atomsPerWeek: number;
  onChangeAtomsPerWeek: (value: number) => void;
}) {
  const minutesPerWeek = atomsPerWeek * MINUTES_PER_ATOM;
  const n = projection.weeksToTarget;
  const lastPoint = projection.points[projection.points.length - 1];
  const projectedScore = lastPoint?.projectedScoreMid ?? null;

  return (
    <section className="card-section space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Proyección de mejora
      </h2>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">
          Si estudias{" "}
          <span className="font-semibold">
            {atomsPerWeek} conceptos
          </span>{" "}
          por semana
          <span className="text-gray-400 text-xs ml-1">
            ({minutesPerWeek} min/sem)
          </span>
        </label>
        <div className="flex items-center gap-2">
          {ATOMS_STEPS.map((step) => (
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
              {step}
            </button>
          ))}
        </div>
      </div>

      {n ? (
        <div
          className="rounded-xl bg-emerald-50 border border-emerald-100
            px-4 py-3"
        >
          <p className="text-sm font-medium text-emerald-800">
            Alcanzas tu meta en ~{n}{" "}
            {n === 1 ? "semana" : "semanas"}
          </p>
          {targetScore && projectedScore && (
            <p className="text-xs text-emerald-600 mt-0.5">
              Puntaje proyectado: {projectedScore} (meta:{" "}
              {targetScore})
            </p>
          )}
        </div>
      ) : projectedScore ? (
        <p className="text-sm text-gray-600">
          Puntaje proyectado a 20 semanas:{" "}
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
      {[0, 1, 2].map((i) => (
        <div key={i} className="card-section animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-48 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
