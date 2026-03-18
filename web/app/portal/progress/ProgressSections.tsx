"use client";

import Link from "next/link";
import { RETEST_ATOM_THRESHOLD } from "@/lib/diagnostic/scoringConstants";
import type {
  AxisMasteryItem,
  CareerPositioningSummary,
  RetestStatus,
  ScoreDataPoint,
  GoalMilestone,
} from "./types";

// ============================================================================
// SCORE OBJECTIVE SECTION (student-centric: single M1 target + career context)
// ============================================================================

export function GoalMilestonesSection({
  milestones,
  currentScore,
  selectedGoalId,
  onSelectGoal,
  chartVisible = true,
  studentM1Target,
  careerPositioning,
}: {
  milestones: GoalMilestone[];
  currentScore: { mid: number } | null;
  selectedGoalId: string | null;
  onSelectGoal: (goalId: string) => void;
  chartVisible?: boolean;
  studentM1Target?: number | null;
  careerPositioning?: CareerPositioningSummary | null;
}) {
  const m1Target = studentM1Target ?? null;

  if (m1Target === null && milestones.length === 0) {
    return (
      <section className="card-section space-y-3">
        <h2 className="text-base font-semibold text-gray-800">
          Tu objetivo M1
        </h2>
        <p className="text-sm text-gray-500">
          Define tu objetivo de puntaje en{" "}
          <Link
            href="/portal/goals"
            className="text-primary font-medium hover:underline"
          >
            Mis Objetivos
          </Link>{" "}
          para hacer seguimiento de tu progreso.
        </p>
      </section>
    );
  }

  const currentMid = currentScore?.mid ?? null;
  const reachedGoal =
    m1Target !== null && currentMid !== null && currentMid >= m1Target;
  const gap =
    m1Target !== null && currentMid !== null ? m1Target - currentMid : null;
  const progressPct =
    m1Target !== null && currentMid !== null
      ? Math.min(100, Math.round((currentMid / m1Target) * 100))
      : null;

  return (
    <section className="card-section space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Tu objetivo M1
      </h2>

      {m1Target !== null && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {m1Target}
            </span>
            <span className="text-sm text-gray-500">tu objetivo</span>
            {currentMid !== null && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">
                  Actual:{" "}
                  <span className="font-semibold text-gray-800">
                    {currentMid}
                  </span>
                </span>
              </>
            )}
          </div>

          {progressPct !== null && (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  reachedGoal ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {reachedGoal ? (
            <p className="text-sm font-medium text-emerald-700">
              Ya alcanzas tu objetivo
            </p>
          ) : gap !== null ? (
            <p className="text-sm text-gray-600">
              Te faltan{" "}
              <span className="font-semibold">{Math.round(gap)} pts</span> para
              tu objetivo
            </p>
          ) : null}
        </div>
      )}

      {/* Career positioning context */}
      {careerPositioning && careerPositioning.total > 0 && (
        <div
          className="rounded-xl border border-gray-100 bg-gray-50/50
            p-3 space-y-1"
        >
          <p className="text-sm text-gray-700">
            Con tus objetivos actuales, calificas para{" "}
            <span className="font-semibold text-primary">
              {careerPositioning.above}
            </span>{" "}
            de {careerPositioning.total}{" "}
            {careerPositioning.total === 1 ? "carrera" : "carreras"} de interés
          </p>
          <Link
            href="/portal/goals"
            className="text-xs text-primary font-medium hover:underline"
          >
            Ver detalle en Mis Objetivos
          </Link>
        </div>
      )}
    </section>
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

export function AxisBreakdownSection({
  axisMastery,
}: {
  axisMastery: AxisMasteryItem[];
}) {
  if (axisMastery.length === 0) return null;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {axisMastery.map((axis) => {
        const pct =
          axis.total > 0 ? Math.round((axis.mastered / axis.total) * 100) : 0;
        const colors = AXIS_CARD_COLORS[axis.axisCode] ?? AXIS_CARD_COLORS.ALG;

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
            <p className="mt-1.5 text-xs text-gray-500">{pct}% dominado</p>
          </div>
        );
      })}
    </section>
  );
}

// ============================================================================
// RETEST CTA SECTION
// ============================================================================

/**
 * Post-full-test retest gating UI. The first-test CTA (pre-full-test)
 * is handled by LockedProjectionSection; this component only renders
 * for subsequent retest cycles.
 */
export function RetestCTASection({
  retestStatus,
}: {
  retestStatus: RetestStatus;
}) {
  // Retest: eligible + recommended (30+ atoms)
  if (retestStatus.eligible && retestStatus.recommended) {
    return (
      <section
        className="rounded-2xl border border-emerald-200 bg-emerald-50
          p-5 sm:p-6 space-y-3"
      >
        <h2 className="text-base font-semibold text-emerald-800">
          Te recomendamos hacer un test completo
        </h2>
        <p className="text-sm text-emerald-700">
          Has dominado {retestStatus.atomsMasteredSinceLastTest} conceptos
          nuevos. Un test completo mejorará tu estimación de puntaje.
        </p>
        <Link href="/portal/test" className="btn-primary inline-block text-sm">
          Comenzar test completo
        </Link>
      </section>
    );
  }

  // Retest: eligible (threshold met)
  if (retestStatus.eligible) {
    return (
      <section className="card-section space-y-3">
        <h2 className="text-base font-semibold text-gray-800">
          Ya puedes tomar un test completo
        </h2>
        <p className="text-sm text-gray-600">
          Mejora tu estimación de puntaje con un test completo.
        </p>
        <Link
          href="/portal/test"
          className="btn-secondary inline-block text-sm"
        >
          Tomar test
        </Link>
      </section>
    );
  }

  // Atoms met but blocked by time/monthly cap
  if (retestStatus.atomsMasteredSinceLastTest >= RETEST_ATOM_THRESHOLD) {
    return (
      <section className="card-section space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-amber-500 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-base font-semibold text-gray-800">
            Test completo desbloqueado
          </h2>
        </div>
        {retestStatus.blockedReason && (
          <p className="text-sm text-amber-700">{retestStatus.blockedReason}</p>
        )}
      </section>
    );
  }

  // Progress toward unlock (post-first-test)
  const progress = Math.min(
    100,
    Math.round(
      (retestStatus.atomsMasteredSinceLastTest / RETEST_ATOM_THRESHOLD) * 100
    )
  );

  return (
    <section className="card-section space-y-3">
      <h2 className="text-base font-semibold text-gray-800">
        Desbloquear test completo
      </h2>
      <p className="text-sm text-gray-600">
        {retestStatus.atomsMasteredSinceLastTest}/{RETEST_ATOM_THRESHOLD}{" "}
        conceptos para desbloquear
      </p>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all
            duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {retestStatus.blockedReason && (
        <p className="text-xs text-gray-500">{retestStatus.blockedReason}</p>
      )}
    </section>
  );
}

// ============================================================================
// TEST HISTORY TABLE
// ============================================================================

export function TestHistoryTable({ history }: { history: ScoreDataPoint[] }) {
  if (history.length === 0) return null;

  const sorted = [...history].reverse();

  return (
    <section className="card-section space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Historial de tests
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs text-gray-500
                border-b border-gray-100"
            >
              <th className="pb-2 font-medium">Fecha</th>
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 font-medium text-right">Puntaje</th>
              <th className="pb-2 font-medium text-right">Correctas</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={`${row.date}-${i}`}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="py-2.5 text-gray-700">
                  {formatDateLong(row.date)}
                </td>
                <td className="py-2.5">
                  <TypeBadge type={row.type} />
                </td>
                <td
                  className="py-2.5 text-right font-medium text-gray-900
                    tabular-nums"
                >
                  {row.paesScoreMid}
                </td>
                <td className="py-2.5 text-right text-gray-600 tabular-nums">
                  {row.correctAnswers != null && row.totalQuestions != null
                    ? `${row.correctAnswers}/${row.totalQuestions}`
                    : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TypeBadge({ type }: { type: ScoreDataPoint["type"] }) {
  const isDiag = type === "short_diagnostic";
  return (
    <span
      className={[
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        isDiag
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700",
      ].join(" ")}
    >
      {isDiag ? "Diagnóstico" : "Test completo"}
    </span>
  );
}

function formatDateLong(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
