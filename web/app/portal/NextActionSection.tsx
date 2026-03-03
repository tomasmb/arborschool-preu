"use client";

import Link from "next/link";
import { trackStudentNextActionClicked } from "@/lib/analytics";

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
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-xl font-serif font-semibold text-primary">
        Siguiente mejor acción
      </h2>

      {loading && (
        <p className="text-sm text-gray-600">Cargando siguiente acción...</p>
      )}

      {!loading && error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && data?.emptyState && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">{data.emptyState.description}</p>
          <Link
            href={data.emptyState.ctaHref}
            className="btn-primary text-sm"
            onClick={() =>
              trackStudentNextActionClicked(
                data.emptyState?.ctaHref ?? "",
                false
              )
            }
          >
            {data.emptyState.ctaLabel}
          </Link>
        </div>
      )}

      {!loading && !error && !data?.emptyState && (
        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-lg border border-gray-200 p-4 space-y-2">
            <p className="text-xs text-gray-500">Acción recomendada ahora</p>
            <p className="text-lg font-semibold text-primary">
              {data?.nextAction?.axis ?? "Sin acción disponible"}
            </p>
            <p className="text-sm text-gray-700">
              +{data?.nextAction?.pointsGain ?? 0} pts potenciales en{" "}
              {formatMinutes(data?.nextAction?.studyMinutes ?? null)}
            </p>
            <p className="text-xs text-gray-500">
              {data?.nextAction?.questionsUnlocked ?? 0} preguntas oficiales
              desbloqueables
            </p>
            <p className="text-xs text-gray-500">
              Primer átomo: {data?.nextAction?.firstAtom?.title ?? "-"}
            </p>
            <Link
              href="/diagnostico"
              className="btn-primary text-sm"
              onClick={() =>
                trackStudentNextActionClicked("/diagnostico", true)
              }
            >
              Empezar siguiente acción
            </Link>
          </article>

          <article className="rounded-lg border border-gray-200 p-4 space-y-2">
            <p className="text-xs text-gray-500">
              Vista previa de cola (top átomos)
            </p>
            <div className="space-y-2">
              {(data?.queuePreview ?? []).slice(0, 3).map((item) => (
                <div
                  key={item.atomId}
                  className="rounded-md border border-gray-100 p-2"
                >
                  <p className="text-sm font-medium text-primary">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.axis} · eficiencia{" "}
                    {item.efficiency.toLocaleString("es-CL")}
                  </p>
                </div>
              ))}
              {(data?.queuePreview ?? []).length === 0 && (
                <p className="text-sm text-gray-600">
                  Sin elementos para mostrar.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Orquestación completa de SR: próxima iteración.
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
