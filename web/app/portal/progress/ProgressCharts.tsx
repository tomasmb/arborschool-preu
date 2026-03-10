"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ErrorBar,
  Legend,
} from "recharts";
import { MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";
import type {
  ProjectionPoint,
  ProjectionResult,
  ScoreDataPoint,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const ATOMS_STEPS = [2, 5, 10, 15, 20];

const COLOR = {
  primary: "#0b3a5b",
  amber: "#d97706",
  emerald: "#059669",
  grid: "#e5e7eb",
  band: "rgba(11, 58, 91, 0.08)",
};

// ============================================================================
// SCORE HISTORY CHART
// ============================================================================

export function ScoreHistorySection({
  history,
  currentScore,
  targetScore,
}: {
  history: ScoreDataPoint[];
  currentScore: { min: number; max: number; mid: number } | null;
  targetScore: number | null;
}) {
  if (history.length === 0 && !currentScore) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-serif font-semibold text-primary mb-3">
          Historial de puntajes
        </h2>
        <p className="text-sm text-gray-500">
          Aún no tienes tests completados. Completa un diagnóstico para ver tu
          puntaje aquí.
        </p>
      </section>
    );
  }

  const points = history.length > 0 ? history : [];

  const diagPoints = points
    .map((p, i) => ({
      idx: i,
      date: formatDate(p.date),
      mid: p.type === "short_diagnostic" ? p.paesScoreMid : null,
      errorY:
        p.type === "short_diagnostic"
          ? [p.paesScoreMid - p.paesScoreMin, p.paesScoreMax - p.paesScoreMid]
          : [0, 0],
    }))
    .filter((p) => p.mid !== null);

  const testPoints = points
    .map((p, i) => ({
      idx: i,
      date: formatDate(p.date),
      mid: p.type === "full_test" ? p.paesScoreMid : null,
      errorY:
        p.type === "full_test"
          ? [p.paesScoreMid - p.paesScoreMin, p.paesScoreMax - p.paesScoreMid]
          : [0, 0],
    }))
    .filter((p) => p.mid !== null);

  const lineData = points.map((p, i) => ({
    idx: i,
    date: formatDate(p.date),
    mid: p.paesScoreMid,
  }));

  const allScores = points.flatMap((p) => [p.paesScoreMin, p.paesScoreMax]);
  if (targetScore) allScores.push(targetScore);
  const yMin = Math.max(100, Math.min(...allScores) - 50);
  const yMax = Math.min(1000, Math.max(...allScores) + 50);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-serif font-semibold text-primary mb-4">
        Historial de puntajes
      </h2>

      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 45, left: 0, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke={COLOR.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              type="category"
              allowDuplicatedCategory={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={{ stroke: COLOR.grid }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<HistoryTooltip />} />

            {targetScore ? (
              <ReferenceLine
                y={targetScore}
                stroke={COLOR.emerald}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: "Meta",
                  position: "right",
                  fill: COLOR.emerald,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            ) : null}

            <Line
              data={lineData}
              dataKey="mid"
              stroke={COLOR.primary}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
              legendType="none"
            />

            <Scatter
              data={diagPoints}
              dataKey="mid"
              fill={COLOR.amber}
              shape="circle"
              legendType="circle"
              name="Diagnóstico corto"
            >
              <ErrorBar
                dataKey="errorY"
                direction="y"
                stroke={COLOR.amber}
                strokeWidth={1.5}
                width={6}
              />
            </Scatter>

            <Scatter
              data={testPoints}
              dataKey="mid"
              fill={COLOR.emerald}
              shape="diamond"
              legendType="diamond"
              name="Test completo"
            >
              <ErrorBar
                dataKey="errorY"
                direction="y"
                stroke={COLOR.emerald}
                strokeWidth={1.5}
                width={6}
              />
            </Scatter>

            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 12, color: "#6b7280" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function HistoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const mid = d.mid as number | null;
  if (mid == null) return null;

  const errorY = d.errorY as [number, number] | undefined;
  const min = errorY ? mid - errorY[0] : mid;
  const max = errorY ? mid + errorY[1] : mid;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-gray-800">{d.date as string}</p>
      <p className="text-gray-600">
        Puntaje: <span className="font-semibold">{mid}</span>
      </p>
      <p className="text-gray-500">
        Banda: {min} – {max}
      </p>
    </div>
  );
}

// ============================================================================
// PROJECTION SECTION
// ============================================================================

export function ProjectionSection({
  projection,
  targetScore,
  atomsPerWeek,
  onChangeAtomsPerWeek,
}: {
  projection: ProjectionResult;
  targetScore: number | null;
  atomsPerWeek: number;
  onChangeAtomsPerWeek: (value: number) => void;
}) {
  const minutesPerWeek = atomsPerWeek * MINUTES_PER_ATOM;
  const pts = projection.points;
  const n = projection.weeksToTarget;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Proyección de mejora
      </h2>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">
          Conceptos por semana:{" "}
          <span className="font-semibold">{atomsPerWeek}</span>
        </label>
        <div className="flex items-center gap-2">
          {ATOMS_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onChangeAtomsPerWeek(step)}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                step === atomsPerWeek
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {step}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          = {minutesPerWeek} minutos por semana
        </p>
      </div>

      {pts.length > 0 ? (
        <ProjectionChart
          points={pts}
          targetScore={targetScore}
          weeksToTarget={projection.weeksToTarget}
        />
      ) : (
        <p className="text-sm text-gray-500">
          No hay datos suficientes para proyectar.
        </p>
      )}

      {n ? (
        <p className="text-sm text-emerald-700 font-medium">
          Alcanzas tu meta en ~{n} {n === 1 ? "semana" : "semanas"}
        </p>
      ) : null}

      <p className="text-xs text-gray-400">
        Proyección limitada por tu último test. Un test completo puede subir el
        techo.
      </p>
    </section>
  );
}

// ============================================================================
// PROJECTION CHART
// ============================================================================

function ProjectionChart({
  points,
  targetScore,
  weeksToTarget,
}: {
  points: ProjectionPoint[];
  targetScore: number | null;
  weeksToTarget: number | null;
}) {
  const allVals = points.flatMap((p) => [
    p.projectedScoreMin,
    p.projectedScoreMax,
  ]);
  if (targetScore) allVals.push(targetScore);
  const yMin = Math.max(100, Math.min(...allVals) - 30);
  const yMax = Math.min(1000, Math.max(...allVals) + 30);

  const chartData = points.map((p) => ({
    week: p.week,
    label: `Sem ${p.week}`,
    mid: p.projectedScoreMid,
    min: p.projectedScoreMin,
    max: p.projectedScoreMax,
    range: [p.projectedScoreMin, p.projectedScoreMax] as [number, number],
  }));

  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 45, left: 0, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 6"
            stroke={COLOR.grid}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={{ stroke: COLOR.grid }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip content={<ProjectionTooltip />} />

          {targetScore ? (
            <ReferenceLine
              y={targetScore}
              stroke={COLOR.emerald}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: "Meta",
                position: "right",
                fill: COLOR.emerald,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          ) : null}

          {weeksToTarget ? (
            <ReferenceLine
              x={`Sem ${weeksToTarget}`}
              stroke={COLOR.emerald}
              strokeDasharray="3 3"
            />
          ) : null}

          <Area
            dataKey="range"
            fill={COLOR.band}
            stroke="none"
            isAnimationActive={false}
          />
          <Line
            dataKey="mid"
            stroke={COLOR.primary}
            strokeWidth={2}
            dot={{ r: 3, fill: COLOR.primary }}
            activeDot={{ r: 5, fill: COLOR.primary }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProjectionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-gray-800">{d.label as string}</p>
      <p className="text-gray-600">
        Proyectado: <span className="font-semibold">{d.mid as number}</span>
      </p>
      <p className="text-gray-500">
        Banda: {d.min as number} – {d.max as number}
      </p>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-CL", {
    month: "short",
    day: "numeric",
  });
}
