"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackStudentDashboardViewed } from "@/lib/analytics";
import { NextActionSection, type NextActionPayload } from "./NextActionSection";

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

  const [nextActionLoading, setNextActionLoading] = useState(true);
  const [nextActionError, setNextActionError] = useState<string | null>(null);
  const [nextActionData, setNextActionData] =
    useState<NextActionPayload | null>(null);

  const [weeklyMinutes, setWeeklyMinutes] = useState(360);

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
        setWeeklyMinutes(payload.data.effort.model.recommendedWeeklyMinutes);
        trackStudentDashboardViewed(payload.data.status);
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

  useEffect(() => {
    let isMounted = true;

    async function loadNextAction() {
      setNextActionLoading(true);
      setNextActionError(null);

      try {
        const response = await fetch("/api/student/next-action", {
          method: "GET",
          credentials: "include",
        });

        const payload = (await response.json()) as {
          success: boolean;
          error?: string;
          data?: NextActionPayload;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(
            payload.error ?? "No se pudo cargar siguiente acción"
          );
        }

        if (!isMounted) {
          return;
        }

        setNextActionData(payload.data);
      } catch (loadError) {
        if (isMounted) {
          setNextActionError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar siguiente acción"
          );
        }
      } finally {
        if (isMounted) {
          setNextActionLoading(false);
        }
      }
    }

    loadNextAction();

    return () => {
      isMounted = false;
    };
  }, []);

  const projectedScore = useMemo(() => {
    if (!data || data.current.score === null) {
      return null;
    }

    const minutesPerPoint = data.effort.model.minutesPerPoint;
    if (minutesPerPoint === null || minutesPerPoint <= 0) {
      return null;
    }

    const totalMinutes = weeklyMinutes * data.effort.model.forecastWeeks;
    const projectedDelta = totalMinutes / minutesPerPoint;
    const projectedRaw = Math.round(data.current.score + projectedDelta);

    const scoreCappedToBounds = Math.max(100, Math.min(1000, projectedRaw));

    if (data.prediction.max !== null) {
      return Math.min(scoreCappedToBounds, data.prediction.max);
    }

    return scoreCappedToBounds;
  }, [data, weeklyMinutes]);

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
            <p className="text-xs text-gray-500">Minutos estimados</p>
            <p className="text-2xl font-semibold text-primary">
              {formatMinutes(data.effort.estimatedMinutesToTarget)}
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
              Segun diagnostico actual
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Ruta top (ROI)</p>
            <p className="text-lg font-semibold text-primary">
              {data.effort.topRoute?.axis ?? "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              +{data.effort.topRoute?.pointsGain ?? 0} pts en{" "}
              {formatMinutes(data.effort.topRoute?.studyMinutes ?? null)}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xl font-serif font-semibold text-primary">
          Escenario de esfuerzo semanal
        </h2>

        <div className="space-y-3">
          <label className="block text-sm text-gray-700">
            Minutos por semana:{" "}
            <span className="font-semibold">{weeklyMinutes} min</span>
          </label>
          <input
            type="range"
            min={120}
            max={1200}
            step={30}
            value={weeklyMinutes}
            onChange={(event) => setWeeklyMinutes(Number(event.target.value))}
            className="w-full"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Horizonte</p>
              <p className="text-lg font-semibold text-primary">
                {data.effort.model.forecastWeeks} semanas
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Escenario M1</p>
              <p className="text-lg font-semibold text-primary">
                {formatScore(projectedScore)}
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Techo diagnóstico</p>
              <p className="text-lg font-semibold text-primary">
                {formatScore(data.prediction.max)}
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Ritmo estimado</p>
              <p className="text-sm font-semibold text-primary">
                {data.effort.model.minutesPerPoint !== null
                  ? `${data.effort.model.minutesPerPoint.toLocaleString("es-CL")} min/pto`
                  : "-"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.effort.model.minutesPerTenPoints !== null
                  ? `${data.effort.model.minutesPerTenPoints.toLocaleString("es-CL")} min/+10`
                  : "Sin señal suficiente"}
              </p>
            </article>
          </div>
        </div>
      </section>

      <NextActionSection
        loading={nextActionLoading}
        error={nextActionError}
        data={nextActionData}
      />

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
