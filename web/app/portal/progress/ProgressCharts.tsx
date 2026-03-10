"use client";

import { MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";
import type {
  ProjectionPoint,
  ProjectionResult,
  ScoreDataPoint,
} from "./types";

// ============================================================================
// CHART CONSTANTS
// ============================================================================

const CHART_W = 600;
const CHART_H = 280;
const PAD = { top: 20, right: 20, bottom: 40, left: 50 };

const ATOMS_STEPS = [2, 5, 10, 15, 20];

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
  const allScores = points.flatMap((p) => [p.paesScoreMin, p.paesScoreMax]);
  if (targetScore) allScores.push(targetScore);
  const yMin = Math.max(100, Math.min(...allScores) - 50);
  const yMax = Math.min(1000, Math.max(...allScores) + 50);

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const xScale = (i: number) =>
    PAD.left +
    (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const yScale = (v: number) =>
    PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-serif font-semibold text-primary mb-4">
        Historial de puntajes
      </h2>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full max-w-[600px] mx-auto"
          aria-label="Gráfico de historial de puntajes"
        >
          <GridLines yScale={yScale} yMin={yMin} yMax={yMax} />
          {targetScore ? <TargetLine y={yScale(targetScore)} /> : null}

          {points.map((p, i) => (
            <DataPoint
              key={`${p.date}-${i}`}
              cx={xScale(i)}
              yScale={yScale}
              point={p}
              dateLabel={formatDate(p.date)}
            />
          ))}

          {points.length > 1 ? (
            <polyline
              fill="none"
              stroke="#0b3a5b"
              strokeWidth={1.5}
              points={points
                .map((p, i) => `${xScale(i)},${yScale(p.paesScoreMid)}`)
                .join(" ")}
            />
          ) : null}
        </svg>
      </div>

      <ChartLegend showTarget={!!targetScore} />
    </section>
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

      {projection.weeksToTarget ? (
        <p className="text-sm text-emerald-700 font-medium">
          Alcanzas tu meta en ~{projection.weeksToTarget} semanas
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
// PROJECTION CHART (SVG)
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

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const xScale = (week: number) =>
    PAD.left + ((week - 1) / Math.max(1, points.length - 1)) * plotW;
  const yScale = (v: number) =>
    PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const topLine = points
    .map((p) => `${xScale(p.week)},${yScale(p.projectedScoreMax)}`)
    .join(" ");
  const bottomLineRev = [...points]
    .reverse()
    .map((p) => `${xScale(p.week)},${yScale(p.projectedScoreMin)}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full max-w-[600px] mx-auto"
        aria-label="Gráfico de proyección"
      >
        <GridLines yScale={yScale} yMin={yMin} yMax={yMax} />
        {targetScore ? <TargetLine y={yScale(targetScore)} /> : null}

        <polygon
          points={`${topLine} ${bottomLineRev}`}
          fill="#0b3a5b"
          fillOpacity={0.1}
        />
        <polyline
          fill="none"
          stroke="#0b3a5b"
          strokeWidth={2}
          points={points
            .map((p) => `${xScale(p.week)},${yScale(p.projectedScoreMid)}`)
            .join(" ")}
        />

        {weeksToTarget ? (
          <g>
            <line
              x1={xScale(weeksToTarget)}
              y1={PAD.top}
              x2={xScale(weeksToTarget)}
              y2={CHART_H - PAD.bottom}
              stroke="#059669"
              strokeDasharray="3,3"
            />
            <circle
              cx={xScale(weeksToTarget)}
              cy={yScale(
                points.find((p) => p.week === weeksToTarget)
                  ?.projectedScoreMid ?? 0
              )}
              r={5}
              fill="#059669"
            />
          </g>
        ) : null}

        {points
          .filter((p) => p.week === 1 || p.week % 4 === 0)
          .map((p) => (
            <text
              key={p.week}
              x={xScale(p.week)}
              y={CHART_H - 8}
              textAnchor="middle"
              className="fill-gray-400 text-[10px]"
            >
              Sem {p.week}
            </text>
          ))}
      </svg>
    </div>
  );
}

// ============================================================================
// SHARED SVG HELPERS
// ============================================================================

function GridLines({
  yScale,
  yMin,
  yMax,
}: {
  yScale: (v: number) => number;
  yMin: number;
  yMax: number;
}) {
  const ticks = [yMin, Math.round((yMin + yMax) / 2), yMax];
  return (
    <>
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            y1={yScale(v)}
            x2={CHART_W - PAD.right}
            y2={yScale(v)}
            stroke="#e5e7eb"
            strokeDasharray="4,4"
          />
          <text
            x={PAD.left - 8}
            y={yScale(v) + 4}
            textAnchor="end"
            className="fill-gray-400 text-[11px]"
          >
            {v}
          </text>
        </g>
      ))}
    </>
  );
}

function TargetLine({ y }: { y: number }) {
  return (
    <g>
      <line
        x1={PAD.left}
        y1={y}
        x2={CHART_W - PAD.right}
        y2={y}
        stroke="#059669"
        strokeDasharray="6,4"
        strokeWidth={1.5}
      />
      <text
        x={CHART_W - PAD.right + 4}
        y={y + 4}
        className="fill-emerald-600 text-[10px] font-medium"
      >
        Meta
      </text>
    </g>
  );
}

function DataPoint({
  cx,
  yScale,
  point,
  dateLabel,
}: {
  cx: number;
  yScale: (v: number) => number;
  point: ScoreDataPoint;
  dateLabel: string;
}) {
  const isDiag = point.type === "short_diagnostic";
  return (
    <g>
      <line
        x1={cx}
        y1={yScale(point.paesScoreMin)}
        x2={cx}
        y2={yScale(point.paesScoreMax)}
        stroke={isDiag ? "#d97706" : "#059669"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {isDiag ? (
        <circle cx={cx} cy={yScale(point.paesScoreMid)} r={5} fill="#d97706" />
      ) : (
        <polygon
          points={`${cx},${yScale(point.paesScoreMid) - 6} ${cx + 6},${yScale(point.paesScoreMid)} ${cx},${yScale(point.paesScoreMid) + 6} ${cx - 6},${yScale(point.paesScoreMid)}`}
          fill="#059669"
        />
      )}
      <text
        x={cx}
        y={CHART_H - 8}
        textAnchor="middle"
        className="fill-gray-400 text-[10px]"
      >
        {dateLabel}
      </text>
    </g>
  );
}

function ChartLegend({ showTarget }: { showTarget: boolean }) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
        Diagnóstico corto
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 bg-emerald-500 inline-block rotate-45" />
        Test completo
      </span>
      {showTarget ? (
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-emerald-600 inline-block" />
          Meta
        </span>
      ) : null}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-CL", { month: "short", day: "numeric" });
}
