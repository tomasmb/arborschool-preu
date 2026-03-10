"use client";

import Link from "next/link";
import { AXIS_NAMES, type Axis } from "@/lib/diagnostic/config";
import type { FullTestResults } from "./useFullTestFlow";

// ============================================================================
// RESULTS SCREEN
// ============================================================================

export function ResultsScreen({ results }: { results: FullTestResults }) {
  const midScore = Math.round(
    (results.paesScoreMin + results.paesScoreMax) / 2
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-off-white px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-primary">
            Resultados
          </h1>
          <p className="text-gray-600">Test Completo PAES M1</p>
        </div>

        <ScoreCard
          midScore={midScore}
          min={results.paesScoreMin}
          max={results.paesScoreMax}
          level={results.level}
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-3xl font-bold text-primary tabular-nums">
            {results.correctAnswers}
            <span className="text-lg font-normal text-gray-400">
              /{results.totalQuestions}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Respuestas correctas</p>
        </div>

        <AxisBreakdown axisPerformance={results.axisPerformance} />

        <div className="space-y-3">
          <Link
            href="/portal/progress"
            className="block w-full rounded-xl bg-primary px-6 py-3.5
              text-center text-base font-semibold text-white
              hover:bg-primary-dark transition"
          >
            Ver tu progreso
          </Link>
          <Link
            href="/portal"
            className="block w-full rounded-xl border border-gray-300 px-6 py-3
              text-center text-sm font-medium text-gray-700
              hover:bg-gray-50 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreCard({
  midScore,
  min,
  max,
  level,
}: {
  midScore: number;
  min: number;
  max: number;
  level: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div
        className="h-[3px]"
        style={{
          background: "linear-gradient(90deg, #0b3a5b, #134b73, #059669)",
        }}
      />
      <div className="p-6 text-center space-y-3">
        <p className="text-6xl font-bold text-primary tabular-nums">
          {midScore.toLocaleString("es-CL")}
        </p>
        <p className="text-sm text-gray-500">
          Banda {min}–{max}
        </p>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          {level}
        </span>
      </div>
    </div>
  );
}

function AxisBreakdown({
  axisPerformance,
}: {
  axisPerformance: FullTestResults["axisPerformance"];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
        Rendimiento por eje
      </h2>
      <div className="space-y-3">
        {(Object.keys(AXIS_NAMES) as Axis[]).map((axis) => {
          const perf = axisPerformance[axis];
          if (!perf || perf.total === 0) return null;
          return (
            <AxisBar
              key={axis}
              label={AXIS_NAMES[axis]}
              correct={perf.correct}
              total={perf.total}
              percentage={perf.percentage}
            />
          );
        })}
      </div>
    </div>
  );
}

function AxisBar({
  label,
  correct,
  total,
  percentage,
}: {
  label: string;
  correct: number;
  total: number;
  percentage: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500 tabular-nums">
          {correct}/{total} ({percentage}%)
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// TIME UP MODAL
// ============================================================================

export function TimeUpModal({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-600"
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
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          Se acabó el tiempo
        </h3>
        <p className="text-sm text-gray-600">
          Tu test será enviado con las respuestas que alcanzaste a completar.
        </p>
        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-xl bg-primary px-6 py-3 text-base
            font-semibold text-white hover:bg-primary-dark transition"
        >
          Ver resultados
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SUBMITTING SCREEN
// ============================================================================

export function SubmittingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-gray-600 font-medium">
          Enviando tu test y calculando resultados...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED SPINNER
// ============================================================================

export function Spinner({ size = "sm" }: { size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-10 h-10" : "w-5 h-5";
  return (
    <svg
      className={`${dim} animate-spin text-primary mx-auto`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
