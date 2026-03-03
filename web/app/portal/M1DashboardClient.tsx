"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DashboardPayload = {
  status: "ready" | "missing_diagnostic" | "missing_target" | "missing_mastery";
  current: {
    score: number | null;
    min: number | null;
    max: number | null;
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
    level: "low" | "medium" | "high";
    score: number;
    bandWidth: number | null;
    masteredAtoms: number;
    totalAtoms: number;
    masteryPercentage: number;
  };
  effort: {
    estimatedHoursToTarget: number | null;
    topRoute: {
      axis: string;
      pointsGain: number;
      studyHours: number;
    } | null;
    model: {
      forecastWeeks: number;
      recommendedWeeklyHours: number;
      hoursPerPoint: number | null;
    };
  };
  emptyState: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
};

function formatScore(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("es-CL");
}

function formatHours(value: number | null): string {
  if (value === null) {
    return "-";
  }

  if (value === 0) {
    return "0 h";
  }

  return `${value.toLocaleString("es-CL", { maximumFractionDigits: 1 })} h`;
}

function confidenceLabel(level: DashboardPayload["confidence"]["level"]) {
  if (level === "high") {
    return "Alta";
  }
  if (level === "medium") {
    return "Media";
  }

  return "Baja";
}

export function M1DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);

  const [weeklyHours, setWeeklyHours] = useState(6);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/student/dashboard/m1", {
          method: "GET",
          credentials: "include",
        });

        const payload = (await response.json()) as {
          success: boolean;
          error?: string;
          data?: DashboardPayload;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "No se pudo cargar el dashboard");
        }

        if (!isMounted) {
          return;
        }

        setData(payload.data);
        setWeeklyHours(payload.data.effort.model.recommendedWeeklyHours);
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el dashboard"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const projectedScore = useMemo(() => {
    if (!data || data.current.score === null) {
      return null;
    }

    const hoursPerPoint = data.effort.model.hoursPerPoint;
    if (hoursPerPoint === null || hoursPerPoint <= 0) {
      return null;
    }

    const totalHours = weeklyHours * data.effort.model.forecastWeeks;
    const projectedDelta = totalHours / hoursPerPoint;
    const projected = Math.round(data.current.score + projectedDelta);

    return Math.max(100, Math.min(1000, projected));
  }, [data, weeklyHours]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Cargando dashboard M1...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error}</p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  if (data.status !== "ready" && data.emptyState) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-3">
        <h2 className="text-xl font-serif font-semibold text-primary">
          {data.emptyState.title}
        </h2>
        <p className="text-sm text-amber-800">{data.emptyState.description}</p>
        <Link href={data.emptyState.ctaHref} className="btn-primary text-sm">
          {data.emptyState.ctaLabel}
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xl font-serif font-semibold text-primary">
          M1 hoy vs meta
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">M1 hoy</p>
            <p className="text-2xl font-semibold text-primary">
              {formatScore(data.current.score)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Banda: {formatScore(data.current.min)} -{" "}
              {formatScore(data.current.max)}
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Meta M1</p>
            <p className="text-2xl font-semibold text-primary">
              {formatScore(data.target.score)}
            </p>
            <p
              className="text-xs text-gray-500 mt-1 truncate"
              title={data.target.goalLabel ?? ""}
            >
              {data.target.goalLabel ?? "Sin meta seleccionada"}
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Brecha</p>
            <p className="text-2xl font-semibold text-primary">
              {data.target.gapPoints ?? "-"} pts
            </p>
            <p className="text-xs text-gray-500 mt-1">Hoy vs objetivo M1</p>
          </article>

          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Horas estimadas</p>
            <p className="text-2xl font-semibold text-primary">
              {formatHours(data.effort.estimatedHoursToTarget)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Para cerrar la brecha</p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xl font-serif font-semibold text-primary">
          Confianza y proyección
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Confianza</p>
            <p className="text-2xl font-semibold text-primary">
              {confidenceLabel(data.confidence.level)} ({data.confidence.score}
              %)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Dominio: {data.confidence.masteredAtoms}/
              {data.confidence.totalAtoms} atomos
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Banda predicha M1</p>
            <p className="text-2xl font-semibold text-primary">
              {formatScore(data.prediction.min)} -{" "}
              {formatScore(data.prediction.max)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Segun señal de dominio actual
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Ruta top (ROI)</p>
            <p className="text-lg font-semibold text-primary">
              {data.effort.topRoute?.axis ?? "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              +{data.effort.topRoute?.pointsGain ?? 0} pts en{" "}
              {formatHours(data.effort.topRoute?.studyHours ?? null)}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xl font-serif font-semibold text-primary">
          Forecast por esfuerzo semanal
        </h2>

        <div className="space-y-3">
          <label className="block text-sm text-gray-700">
            Horas por semana:{" "}
            <span className="font-semibold">{weeklyHours} h</span>
          </label>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={weeklyHours}
            onChange={(event) => setWeeklyHours(Number(event.target.value))}
            className="w-full"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Horizonte</p>
              <p className="text-lg font-semibold text-primary">
                {data.effort.model.forecastWeeks} semanas
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Score proyectado</p>
              <p className="text-lg font-semibold text-primary">
                {formatScore(projectedScore)}
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Referencia</p>
              <p className="text-lg font-semibold text-primary">
                {formatScore(data.prediction.max)} max sugerido
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/portal/goals" className="btn-primary text-sm">
            Ajustar metas y simulacion
          </Link>
          <p className="text-sm text-gray-600">
            Las metas del simulador actualizan este dashboard automaticamente.
          </p>
        </div>
      </section>
    </div>
  );
}
