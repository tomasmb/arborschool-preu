"use client";

import Link from "next/link";
import { ConfidenceBadge, StreakBadge } from "./components";
import { formatScore } from "./formatters";
import { useAnimatedMount, useCountUp } from "./hooks";
import type { DashboardPayload } from "./types";

function DiagnosticSourceBanner({
  source,
  retestStatus,
}: {
  source: DashboardPayload["diagnosticSource"];
  retestStatus: DashboardPayload["retestStatus"];
}) {
  if (source === "full_test") {
    return (
      <p className="text-xs text-emerald-600 font-medium">
        Basado en test completo
      </p>
    );
  }

  if (retestStatus?.eligible && retestStatus.recommended) {
    return (
      <Link
        href="/portal/test"
        className="block rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2
          hover:bg-emerald-50 transition space-y-1"
      >
        <p className="text-xs font-medium text-emerald-700">
          Te recomendamos un test completo
        </p>
        <p className="text-xs text-emerald-600">
          Has dominado {retestStatus.atomsMasteredSinceLastTest} conceptos
          nuevos desde tu último diagnóstico.
        </p>
      </Link>
    );
  }

  if (retestStatus?.eligible) {
    return (
      <Link
        href="/portal/test"
        className="block rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2
          hover:bg-amber-50 transition space-y-1"
      >
        <p className="text-xs font-medium text-amber-700">
          Ya puedes tomar un test completo
        </p>
        <p className="text-xs text-amber-600">
          Mejora tu estimación con un test de 60 preguntas.
        </p>
      </Link>
    );
  }

  if (retestStatus && !retestStatus.eligible) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 space-y-1">
        <p className="text-xs text-amber-700">
          Estimado desde diagnóstico corto (16 preguntas).
        </p>
        <p className="text-xs text-amber-600">
          {retestStatus.atomsMasteredSinceLastTest}/18 conceptos para
          desbloquear test completo.
        </p>
      </div>
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
              currentStreak={data.streak.currentStreak}
              maxStreak={data.streak.maxStreak}
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

        <DiagnosticSourceBanner
          source={data.diagnosticSource}
          retestStatus={data.retestStatus}
        />
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
              : `${remaining} ${remaining !== 1 ? "sesiones" : "sesión"} más para completar`}
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

type ProgressSectionProps = {
  data: DashboardPayload;
};

export function DashboardProgressSection({ data }: ProgressSectionProps) {
  const {
    masteredAtoms,
    totalAtoms,
    masteryPercentage,
    questionsUnlocked,
    totalOfficialQuestions,
  } = data.confidence;
  const mounted = useAnimatedMount();
  const animatedMastery = useCountUp(masteryPercentage);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Tu progreso
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
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
        <div className="rounded-xl bg-gradient-to-br from-amber-500/5 to-white border border-amber-100 p-4">
          <p className="text-3xl font-bold text-amber-600 tabular-nums">
            {questionsUnlocked}
            <span className="text-lg font-normal text-gray-400">
              /{totalOfficialQuestions}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Preguntas PAES desbloqueadas
          </p>
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

export function DashboardProgressLink() {
  return (
    <Link
      href="/portal/progress"
      className="rounded-2xl border border-gray-200 bg-white p-4
        flex items-center justify-between hover:bg-gray-50 transition"
    >
      <div>
        <p className="text-sm font-medium text-gray-800">
          Proyección y progreso
        </p>
        <p className="text-xs text-gray-500">
          Ve tu historial de puntajes y proyección de mejora
        </p>
      </div>
      <svg
        className="w-5 h-5 text-gray-400 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </Link>
  );
}
