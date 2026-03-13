"use client";

import Link from "next/link";
import type { RetestStatus, ScoreDataPoint } from "./types";

// ============================================================================
// RETEST CTA SECTION
// ============================================================================

export function RetestCTASection({
  retestStatus,
}: {
  retestStatus: RetestStatus;
}) {
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
        <Link
          href="/portal/test"
          className="btn-primary inline-block text-sm"
        >
          Comenzar test completo
        </Link>
      </section>
    );
  }

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

  if (retestStatus.atomsMasteredSinceLastTest >= 18) {
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
          <p className="text-sm text-amber-700">
            {retestStatus.blockedReason}
          </p>
        )}
      </section>
    );
  }

  const progress = Math.min(
    100,
    Math.round((retestStatus.atomsMasteredSinceLastTest / 18) * 100)
  );

  return (
    <section className="card-section space-y-3">
      <h2 className="text-base font-semibold text-gray-800">
        Desbloquear test completo
      </h2>
      <p className="text-sm text-gray-600">
        {retestStatus.atomsMasteredSinceLastTest}/18 conceptos para
        desbloquear
      </p>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all
            duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {retestStatus.blockedReason && (
        <p className="text-xs text-gray-500">
          {retestStatus.blockedReason}
        </p>
      )}
    </section>
  );
}

// ============================================================================
// TEST HISTORY TABLE
// ============================================================================

export function TestHistoryTable({
  history,
}: {
  history: ScoreDataPoint[];
}) {
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
                <td
                  className="py-2.5 text-right text-gray-600 tabular-nums"
                >
                  {row.correctAnswers != null &&
                  row.totalQuestions != null
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
