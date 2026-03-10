"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageShell, ErrorStatePanel } from "@/app/portal/components";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";
import { resolveApiErrorMessage } from "@/lib/student/apiClientEnvelope";
import { ScoreHistorySection, ProjectionSection } from "./ProgressCharts";
import type { ProgressData, RetestStatus, ScoreDataPoint } from "./types";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressClient() {
  const { data, loading, error, atomsPerWeek, setAtomsPerWeek } =
    useProgressData();

  return (
    <PageShell
      title="Tu progreso"
      subtitle="Historial de puntajes y proyección de mejora"
    >
      {loading ? (
        <ProgressSkeleton />
      ) : error ? (
        <ErrorStatePanel message={error} />
      ) : data ? (
        <div className="space-y-6">
          <ScoreHistorySection
            history={data.scoreHistory}
            currentScore={data.currentScore}
            targetScore={data.targetScore}
          />
          <ProjectionSection
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
// RETEST CTA SECTION
// ============================================================================

function RetestCTASection({ retestStatus }: { retestStatus: RetestStatus }) {
  if (retestStatus.eligible && retestStatus.recommended) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6 space-y-3">
        <h2 className="text-base font-semibold text-emerald-800">
          Te recomendamos hacer un test completo
        </h2>
        <p className="text-sm text-emerald-700">
          Has dominado {retestStatus.atomsMasteredSinceLastTest} conceptos
          nuevos. Un test completo mejorará tu estimación de puntaje.
        </p>
        <Link
          href="/portal/test"
          className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5
            text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          Comenzar test completo
        </Link>
      </section>
    );
  }

  if (retestStatus.eligible) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">
          Ya puedes tomar un test completo
        </h2>
        <p className="text-sm text-gray-600">
          Mejora tu estimación de puntaje con un test completo.
        </p>
        <Link
          href="/portal/test"
          className="inline-block rounded-xl bg-primary/10 px-5 py-2.5
            text-sm font-medium text-primary hover:bg-primary/20 transition"
        >
          Tomar test
        </Link>
      </section>
    );
  }

  const progress = Math.min(
    100,
    Math.round((retestStatus.atomsMasteredSinceLastTest / 18) * 100)
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3">
      <h2 className="text-base font-semibold text-gray-800">
        Desbloquear test completo
      </h2>
      <p className="text-sm text-gray-600">
        {retestStatus.atomsMasteredSinceLastTest}/18 conceptos para desbloquear
      </p>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {retestStatus.blockedReason ? (
        <p className="text-xs text-gray-500">{retestStatus.blockedReason}</p>
      ) : null}
    </section>
  );
}

// ============================================================================
// TEST HISTORY TABLE
// ============================================================================

function TestHistoryTable({ history }: { history: ScoreDataPoint[] }) {
  if (history.length === 0) return null;

  const sorted = [...history].reverse();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Historial de tests
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
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
                <td className="py-2.5 text-right font-medium text-gray-900 tabular-nums">
                  {row.paesScoreMid}
                </td>
                <td className="py-2.5 text-right text-gray-600 tabular-nums">
                  {row.correctAnswers != null && row.totalQuestions != null
                    ? `${row.correctAnswers}/${row.totalQuestions}`
                    : "—"}
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

// ============================================================================
// SKELETON + HELPERS
// ============================================================================

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse"
        >
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-48 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
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
