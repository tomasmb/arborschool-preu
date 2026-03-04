"use client";

import Link from "next/link";
import { ConfidenceBadge, HeroMetricCard, MissionCard } from "./components";
import { formatMinutes, formatScore } from "./formatters";
import type { DashboardPayload } from "./types";

type HeroSectionProps = {
  data: DashboardPayload;
};

export function DashboardHeroSection({ data }: HeroSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl font-serif font-semibold text-primary">
            M1 hoy vs meta
          </h2>
          <p className="text-sm text-gray-600">
            Tu siguiente sesión debe mover la brecha, no solo sumar minutos.
          </p>
        </div>
        <ConfidenceBadge
          level={data.confidence.level}
          score={data.confidence.score}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HeroMetricCard
          label="M1 actual"
          value={formatScore(data.current.score)}
          hint={`Banda ${formatScore(data.current.min)} - ${formatScore(data.current.max)}`}
        />
        <HeroMetricCard
          label="Meta M1"
          value={formatScore(data.target.score)}
          hint={data.target.goalLabel ?? "Define una meta para activar brecha"}
        />
        <HeroMetricCard
          label="Brecha"
          value={`${data.target.gapPoints ?? "-"} pts`}
          hint="Diferencia entre estado actual y meta seleccionada"
          accent="warning"
        />
        <HeroMetricCard
          label="Esfuerzo estimado"
          value={formatMinutes(data.effort.estimatedMinutesToTarget)}
          hint="Minutos aproximados para cerrar la brecha actual"
          accent="success"
        />
      </div>
    </section>
  );
}

type EffortSectionProps = {
  data: DashboardPayload;
  weeklyMinutes: number;
  projectedScore: number | null;
  onChangeWeeklyMinutes: (value: number) => void;
};

export function DashboardEffortSection({
  data,
  weeklyMinutes,
  projectedScore,
  onChangeWeeklyMinutes,
}: EffortSectionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xl font-serif font-semibold text-primary">
          Escenario de esfuerzo
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
            onChange={(event) =>
              onChangeWeeklyMinutes(Number(event.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <HeroMetricCard
            label="Proyección M1"
            value={formatScore(projectedScore)}
            hint={`${data.effort.model.forecastWeeks} semanas de horizonte`}
          />
          <HeroMetricCard
            label="Ritmo estimado"
            value={
              data.effort.model.minutesPerPoint !== null
                ? `${data.effort.model.minutesPerPoint.toLocaleString("es-CL")} min/pto`
                : "-"
            }
            hint={
              data.effort.model.minutesPerTenPoints !== null
                ? `${data.effort.model.minutesPerTenPoints.toLocaleString("es-CL")} min por +10 pts`
                : "Aún sin señal suficiente"
            }
          />
        </div>
      </section>

      <MissionCard
        targetSessions={data.mission.targetSessions}
        completedSessions={data.mission.completedSessions}
        weekStartDate={data.mission.weekStartDate}
        weekEndDate={data.mission.weekEndDate}
      />
    </div>
  );
}

export function DashboardFooterSection() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/portal/goals" className="btn-primary text-sm">
          Ajustar meta y simulador
        </Link>
        <p className="text-sm text-gray-600">
          Tu meta, buffer y preferencias de planificación se reflejan aquí.
        </p>
      </div>
    </section>
  );
}
