"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ConfidenceBadge,
  HeroMetricCard,
  MissionCard,
  ProgressRail,
  StreakBadge,
} from "./components";
import { formatMinutes, formatScore } from "./formatters";
import { useAnimatedMount, useCountUp } from "./hooks";
import type { DashboardPayload } from "./types";

function DiagnosticSourceBanner({
  source,
}: {
  source: DashboardPayload["diagnosticSource"];
}) {
  if (source === "full_test") {
    return (
      <p className="text-xs text-emerald-600 font-medium">
        Basado en test completo
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 space-y-1">
      <p className="text-xs text-amber-700">
        Estimado desde diagnóstico corto (16 preguntas).
      </p>
      <p className="text-xs text-amber-600">
        Pronto podrás tomar un test completo para mejorar tu estimación.
      </p>
    </div>
  );
}

type HeroSectionProps = {
  data: DashboardPayload;
};

function ScoreProgressBar({
  current,
  target,
}: {
  current: number | null;
  target: number | null;
}) {
  const mounted = useAnimatedMount();
  if (current === null || target === null || target <= 100) return null;
  const pct = Math.min(
    100,
    Math.round(((current - 100) / (target - 100)) * 100)
  );
  const surplus = current > target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>100</span>
        <span>Meta: {formatScore(target)}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden relative">
        <div
          className={[
            "h-full rounded-full transition-all duration-700 ease-out",
            surplus
              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
              : "bg-gradient-to-r from-primary to-primary-light",
          ].join(" ")}
          style={{ width: mounted ? `${Math.min(pct, 100)}%` : "0%" }}
        />
      </div>
      {surplus ? (
        <p className="text-xs font-medium text-emerald-600">
          Superaste tu meta por +{(current - target).toLocaleString("es-CL")}{" "}
          pts
        </p>
      ) : null}
    </div>
  );
}

export function DashboardHeroSection({ data }: HeroSectionProps) {
  const score = data.current.score;
  const gap = data.target.gapPoints;
  const surplus =
    score !== null && data.target.score !== null && score > data.target.score;
  const animatedScore = useCountUp(score);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Accent top border */}
      <div
        className="h-[3px]"
        style={{
          background: "linear-gradient(90deg, #0b3a5b, #134b73, #d97706)",
        }}
      />
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-baseline gap-3">
            <p className="text-4xl sm:text-5xl font-bold text-primary tabular-nums">
              {score !== null ? animatedScore.toLocaleString("es-CL") : "—"}
            </p>
            <div>
              <p className="text-sm font-medium text-gray-700">Puntaje M1</p>
              <p className="text-xs text-gray-500">
                Banda {formatScore(data.current.min)}–
                {formatScore(data.current.max)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StreakBadge
              sessionsThisWeek={data.mission.completedSessions}
              compact
            />
            <ConfidenceBadge
              level={data.confidence.level}
              score={data.confidence.score}
            />
          </div>
        </div>

        <ScoreProgressBar
          current={data.current.score}
          target={data.target.score}
        />

        {!surplus && gap !== null && gap > 0 ? (
          <p className="text-sm text-gray-600">
            Te faltan{" "}
            <span className="font-semibold text-primary">
              {gap.toLocaleString("es-CL")} pts
            </span>{" "}
            para tu meta
            {data.target.goalLabel ? ` (${data.target.goalLabel})` : ""}.
          </p>
        ) : null}

        <DiagnosticSourceBanner source={data.diagnosticSource} />
      </div>
    </section>
  );
}

type MissionRingSectionProps = {
  data: DashboardPayload;
};

export function DashboardMissionSection({ data }: MissionRingSectionProps) {
  const { targetSessions, completedSessions } = data.mission;
  const remaining = Math.max(0, targetSessions - completedSessions);
  const pct =
    targetSessions > 0
      ? Math.round((completedSessions / targetSessions) * 100)
      : 0;
  const done = remaining === 0;
  const mounted = useAnimatedMount();
  const circumference = 2 * Math.PI * 34;

  return (
    <section className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Misión semanal
      </h2>
      <div className="flex items-center gap-5">
        {/* Ring visualization */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={done ? "#059669" : "#0b3a5b"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={
                mounted
                  ? `${circumference * (1 - pct / 100)}`
                  : `${circumference}`
              }
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {completedSessions}/{targetSessions}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-800">
            {done
              ? "Misión completada esta semana"
              : `${remaining} sesión${remaining !== 1 ? "es" : ""} más para completar`}
          </p>
          <p className="text-xs text-gray-500">
            Semana {data.mission.weekStartDate} — {data.mission.weekEndDate}
          </p>
          {done ? (
            <p className="text-xs font-medium text-emerald-600">
              Excelente ritmo, sigue así
            </p>
          ) : null}
        </div>
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
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
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
          onChange={(e) => onChangeWeeklyMinutes(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <HeroMetricCard
          label="Proyección M1"
          value={formatScore(projectedScore)}
          hint={`Proyectado a ${data.effort.model.forecastWeeks} semanas`}
        />
        <HeroMetricCard
          label="Tiempo estimado a meta"
          value={formatMinutes(data.effort.estimatedMinutesToTarget)}
          hint="Para cerrar la distancia a tu meta"
          accent="success"
        />
      </div>
    </section>
  );
}

type ProgressSectionProps = {
  data: DashboardPayload;
};

export function DashboardProgressSection({ data }: ProgressSectionProps) {
  const { masteredAtoms, totalAtoms, masteryPercentage } = data.confidence;
  const mounted = useAnimatedMount();
  const animatedMastery = useCountUp(masteryPercentage);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Tu progreso
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-white border border-primary/10 p-4">
          <p className="text-3xl font-bold text-primary tabular-nums">
            {masteredAtoms}
            <span className="text-lg font-normal text-gray-400">
              /{totalAtoms}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Conceptos dominados</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/5 to-white border border-emerald-100 p-4">
          <p className="text-3xl font-bold text-emerald-600 tabular-nums">
            {animatedMastery}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Tu avance</p>
          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{ width: mounted ? `${masteryPercentage}%` : "0%" }}
            />
          </div>
        </div>
      </div>
      {data.effort.topRoute ? (
        <p className="text-sm text-gray-600">
          Tu camino recomendado:{" "}
          <span className="font-medium text-primary">
            {data.effort.topRoute.axis}
          </span>{" "}
          (+{data.effort.topRoute.pointsGain} pts potenciales)
        </p>
      ) : null}
    </section>
  );
}

type DetailsSectionProps = {
  data: DashboardPayload;
  weeklyMinutes: number;
  projectedScore: number | null;
  onChangeWeeklyMinutes: (value: number) => void;
};

export function DashboardDetailsSection({
  data,
  weeklyMinutes,
  projectedScore,
  onChangeWeeklyMinutes,
}: DetailsSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium
          text-gray-500 hover:text-gray-700 transition-all py-2 px-4
          rounded-full border border-gray-200 hover:border-gray-300
          hover:bg-gray-50"
      >
        <svg
          className={[
            "w-4 h-4 transition-transform duration-200",
            open ? "rotate-90" : "",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {open ? "Ocultar detalle" : "Ver detalle y escenarios"}
      </button>

      {open ? (
        <div className="space-y-4 mt-2 animate-fade-in-up">
          <DashboardEffortSection
            data={data}
            weeklyMinutes={weeklyMinutes}
            projectedScore={projectedScore}
            onChangeWeeklyMinutes={onChangeWeeklyMinutes}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <Link href="/portal/goals" className="btn-primary text-sm">
              Ajustar metas y simulador
            </Link>
          </section>
        </div>
      ) : null}
    </div>
  );
}
