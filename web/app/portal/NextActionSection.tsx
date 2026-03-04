"use client";

import Link from "next/link";
import { trackStudentNextActionClicked } from "@/lib/analytics";
import { ActionCard } from "./components";

export type NextActionPayload = {
  status: "ready" | "missing_diagnostic" | "missing_mastery";
  nextAction: {
    axis: string;
    pointsGain: number;
    studyMinutes: number;
    questionsUnlocked: number;
    firstAtom: {
      atomId: string;
      title: string;
    } | null;
  } | null;
  queuePreview: {
    atomId: string;
    title: string;
    axis: string;
    efficiency: number;
    unlockScore: number;
    totalCost: number;
    prerequisitesNeeded: string[];
  }[];
  emptyState: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
  sprintHint: {
    ctaHref: string;
    suggestedItemCount: number;
    estimatedMinutes: number;
  };
};

function formatMinutes(value: number | null): string {
  if (value === null) {
    return "-";
  }

  if (value === 0) {
    return "0 min";
  }

  if (value < 60) {
    return `${value.toLocaleString("es-CL")} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (minutes === 0) {
    return `${hours.toLocaleString("es-CL")} h`;
  }

  return `${hours.toLocaleString("es-CL")} h ${minutes.toLocaleString("es-CL")} min`;
}

type NextActionSectionProps = {
  loading: boolean;
  error: string | null;
  data: NextActionPayload | null;
};

export function NextActionSection({
  loading,
  error,
  data,
}: NextActionSectionProps) {
  const emptyState = data?.emptyState ?? null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-xl font-serif font-semibold text-primary">
        Siguiente mejor acción
      </h2>

      {loading && (
        <p className="text-sm text-gray-600">Cargando siguiente acción...</p>
      )}

      {!loading && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!loading && !error && emptyState ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">{emptyState.description}</p>
          <Link
            href={emptyState.ctaHref}
            className="btn-primary text-sm"
            onClick={() =>
              trackStudentNextActionClicked(emptyState.ctaHref, false)
            }
          >
            {emptyState.ctaLabel}
          </Link>
        </div>
      ) : null}

      {!loading && !error && !emptyState ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ActionCard
            title={data?.nextAction?.axis ?? "Sin acción disponible"}
            description={`+${data?.nextAction?.pointsGain ?? 0} pts potenciales en ${formatMinutes(
              data?.nextAction?.studyMinutes ??
                data?.sprintHint.estimatedMinutes ??
                null
            )}.`}
            metrics={
              <div className="space-y-1 text-xs text-gray-600">
                <p>
                  {data?.nextAction?.questionsUnlocked ?? 0} preguntas
                  desbloqueables.
                </p>
                <p>
                  Primer foco:{" "}
                  {data?.nextAction?.firstAtom?.title ?? "No definido"}.
                </p>
              </div>
            }
            primaryLabel="Comenzar sprint de hoy"
            primaryHref={data?.sprintHint.ctaHref ?? "/portal/study"}
            secondaryLabel="Ajustar meta"
            secondaryHref="/portal/goals"
            onPrimaryClick={() =>
              trackStudentNextActionClicked(
                data?.sprintHint.ctaHref ?? "/portal/study",
                true
              )
            }
          />

          <article className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cola recomendada (ROI)
            </p>
            <div className="space-y-2">
              {(data?.queuePreview ?? []).slice(0, 4).map((item, index) => (
                <div
                  key={item.atomId}
                  className="rounded-lg border border-gray-100 px-3 py-2"
                >
                  <p className="text-sm font-medium text-primary">
                    {index + 1}. {item.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.axis} · eficiencia{" "}
                    {item.efficiency.toLocaleString("es-CL")}
                  </p>
                </div>
              ))}
              {(data?.queuePreview ?? []).length === 0 ? (
                <p className="text-sm text-gray-600">
                  Sin elementos para mostrar.
                </p>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
