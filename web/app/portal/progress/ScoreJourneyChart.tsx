"use client";

import { useMemo } from "react";
import type { ScoreDataPoint, ProjectionPoint, GoalMilestone } from "./types";

type Props = {
  history: ScoreDataPoint[];
  projection: ProjectionPoint[];
  milestones: GoalMilestone[];
  currentScore: {
    min: number;
    max: number;
    mid: number;
    isPersonalBest?: boolean;
  } | null;
  diagnosticCeiling: number | null;
};

const W = 600;
const H = 280;
const PAD = { top: 20, right: 20, bottom: 36, left: 54 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

const COLORS = {
  historyLine: "#0b3a5b",
  historyDot: "#0b3a5b",
  projLine: "#059669",
  projBeyond: "#059669",
  band: "#05966920",
  bandBeyond: "#05966912",
  ceiling: "#f59e0b",
  goalLine: "#e11d48",
  grid: "#e5e7eb",
  todayLine: "#94a3b8",
  axisText: "#6b7280",
};

/**
 * SVG line chart showing score history, projection curve, confidence band,
 * diagnostic ceiling, and goal target lines.
 */
export function ScoreJourneyChart({
  history,
  projection,
  milestones,
  currentScore,
  diagnosticCeiling,
}: Props) {
  const { xDomain, yDomain, histPoints, projPoints, goalLines, todayX } =
    useMemo(
      () => buildChartData(history, projection, milestones, currentScore),
      [history, projection, milestones, currentScore]
    );

  if (histPoints.length === 0 && projPoints.length === 0) {
    return (
      <div className="card-section flex items-center justify-center h-48">
        <p className="text-sm text-gray-400">
          Completa un diagnóstico para ver tu progreso.
        </p>
      </div>
    );
  }

  const xScale = (v: number) =>
    PAD.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * CHART_W;
  const yScale = (v: number) =>
    PAD.top +
    CHART_H -
    ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * CHART_H;

  const yTicks = buildYTicks(yDomain);
  const xTicks = buildXTicks(xDomain);

  const bandPath = buildBandPath(projPoints, xScale, yScale);
  const projMidPath = buildLinePath(
    projPoints.map((p) => [p.x, p.mid]),
    xScale,
    yScale
  );
  const histLinePath = buildLinePath(
    histPoints.map((p) => [p.x, p.y]),
    xScale,
    yScale
  );

  const ceilingBoundaryIdx = projPoints.findIndex((p) => p.beyond);

  return (
    <section className="card-section space-y-2">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Tu trayectoria de puntaje
      </h2>
      <div className="overflow-x-auto -mx-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[480px]"
          aria-label="Gráfico de trayectoria de puntaje"
        >
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={COLORS.grid}
              strokeWidth={0.5}
            />
          ))}

          {/* Y axis labels */}
          {yTicks.map((tick) => (
            <text
              key={`y-${tick}`}
              x={PAD.left - 8}
              y={yScale(tick) + 3}
              textAnchor="end"
              fill={COLORS.axisText}
              fontSize={10}
            >
              {tick}
            </text>
          ))}

          {/* X axis labels (weeks) */}
          {xTicks.map((tick) => (
            <text
              key={`x-${tick}`}
              x={xScale(tick)}
              y={H - 8}
              textAnchor="middle"
              fill={COLORS.axisText}
              fontSize={10}
            >
              {tick <= 0 ? formatWeekLabel(tick) : `+${tick} sem`}
            </text>
          ))}

          {/* X axis title */}
          <text
            x={PAD.left + CHART_W / 2}
            y={H - 0}
            textAnchor="middle"
            fill={COLORS.axisText}
            fontSize={9}
            opacity={0.7}
          >
            semanas
          </text>

          {/* Confidence band */}
          {bandPath && <path d={bandPath} fill={COLORS.band} opacity={0.6} />}

          {/* Diagnostic ceiling */}
          {diagnosticCeiling && (
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yScale(diagnosticCeiling)}
              y2={yScale(diagnosticCeiling)}
              stroke={COLORS.ceiling}
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.6}
            />
          )}

          {/* Goal target lines */}
          {goalLines.map((g) => (
            <g key={g.goalId}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yScale(g.score)}
                y2={yScale(g.score)}
                stroke={COLORS.goalLine}
                strokeWidth={1}
                strokeDasharray="4 3"
                opacity={g.isPrimary ? 0.8 : 0.4}
              />
              <text
                x={W - PAD.right - 2}
                y={yScale(g.score) - 4}
                textAnchor="end"
                fill={COLORS.goalLine}
                fontSize={9}
                fontWeight={g.isPrimary ? 600 : 400}
                opacity={g.isPrimary ? 1 : 0.7}
              >
                {g.label}
              </text>
            </g>
          ))}

          {/* "Today" vertical line */}
          {todayX !== null && (
            <line
              x1={xScale(todayX)}
              x2={xScale(todayX)}
              y1={PAD.top}
              y2={PAD.top + CHART_H}
              stroke={COLORS.todayLine}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
          )}

          {/* Projection line — within ceiling */}
          {projMidPath && ceilingBoundaryIdx !== 0 && (
            <path
              d={projMidPath}
              fill="none"
              stroke={COLORS.projLine}
              strokeWidth={2}
              strokeLinecap="round"
            />
          )}

          {/* Historical score line */}
          {histLinePath && histPoints.length > 1 && (
            <path
              d={histLinePath}
              fill="none"
              stroke={COLORS.historyLine}
              strokeWidth={2}
              strokeLinecap="round"
            />
          )}

          {/* Historical score dots */}
          {histPoints.map((p, i) => (
            <circle
              key={`h-${i}`}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={4}
              fill="white"
              stroke={
                p.type === "full_test" ? COLORS.projLine : COLORS.historyDot
              }
              strokeWidth={2}
            />
          ))}

          {/* Today marker dot (current score) */}
          {currentScore && todayX !== null && (
            <circle
              cx={xScale(todayX)}
              cy={yScale(currentScore.mid)}
              r={5}
              fill={COLORS.historyDot}
              stroke="white"
              strokeWidth={2}
            />
          )}
        </svg>
      </div>

      <ChartLegend
        hasHistory={histPoints.length > 0}
        hasProjection={projPoints.length > 0}
        hasCeiling={diagnosticCeiling !== null}
        hasGoals={goalLines.length > 0}
      />
    </section>
  );
}

// ============================================================================
// LEGEND
// ============================================================================

function ChartLegend({
  hasHistory,
  hasProjection,
  hasCeiling,
  hasGoals,
}: {
  hasHistory: boolean;
  hasProjection: boolean;
  hasCeiling: boolean;
  hasGoals: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
      {hasHistory && (
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 rounded"
            style={{ background: COLORS.historyLine }}
          />
          Historial
        </span>
      )}
      {hasProjection && (
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 rounded"
            style={{ background: COLORS.projLine }}
          />
          Proyección
        </span>
      )}
      {hasCeiling && (
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-[1px] border-t border-dashed"
            style={{ borderColor: COLORS.ceiling }}
          />
          Techo diagnóstico
        </span>
      )}
      {hasGoals && (
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-[1px] border-t border-dashed"
            style={{ borderColor: COLORS.goalLine }}
          />
          Meta carrera
        </span>
      )}
    </div>
  );
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

type HistPoint = { x: number; y: number; type: string };
type ProjPoint = {
  x: number;
  mid: number;
  min: number;
  max: number;
  beyond: boolean;
};
type GoalLine = {
  goalId: string;
  score: number;
  label: string;
  isPrimary: boolean;
};

function buildChartData(
  history: ScoreDataPoint[],
  projection: ProjectionPoint[],
  milestones: GoalMilestone[],
  currentScore: { mid: number } | null
) {
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  // Map historical dates to "weeks ago" (negative values)
  const histPoints: HistPoint[] = history.map((h) => ({
    x: (new Date(h.date).getTime() - now) / msPerWeek,
    y: h.paesScoreMid,
    type: h.type,
  }));

  // Projection starts at week 0 (today)
  const projPoints: ProjPoint[] = projection.map((p) => ({
    x: p.week,
    mid: p.projectedScoreMid,
    min: p.projectedScoreMin,
    max: p.projectedScoreMax,
    beyond: p.beyondCeiling,
  }));

  // Add current score as week-0 start of projection
  if (currentScore && projPoints.length > 0) {
    projPoints.unshift({
      x: 0,
      mid: currentScore.mid,
      min: currentScore.mid,
      max: currentScore.mid,
      beyond: false,
    });
  }

  // Goal lines use the student's own M1 target from the simulator
  const goalLines: GoalLine[] = milestones
    .filter((m) => m.userM1Target !== null)
    .map((m) => ({
      goalId: m.goalId,
      score: m.userM1Target!,
      label: truncateLabel(m.careerName, 28),
      isPrimary: m.isPrimary,
    }));

  // Compute axis domains
  const allYValues = [
    ...histPoints.map((p) => p.y),
    ...projPoints.flatMap((p) => [p.min, p.max]),
    ...goalLines.map((g) => g.score),
    currentScore?.mid ?? 100,
  ];
  const allXValues = [
    ...histPoints.map((p) => p.x),
    ...projPoints.map((p) => p.x),
    0,
  ];

  const yMin = Math.max(100, Math.min(...allYValues) - 40);
  const yMax = Math.min(1000, Math.max(...allYValues) + 40);
  const xMin = Math.min(...allXValues, -2);
  const xMax = Math.max(...allXValues, 4);

  return {
    xDomain: [xMin, xMax] as [number, number],
    yDomain: [yMin, yMax] as [number, number],
    histPoints,
    projPoints,
    goalLines,
    todayX: 0,
  };
}

function truncateLabel(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

// ============================================================================
// SVG PATH BUILDERS
// ============================================================================

function buildLinePath(
  points: [number, number][],
  xScale: (v: number) => number,
  yScale: (v: number) => number
): string | null {
  if (points.length < 2) return null;
  return points
    .map(([x, y], i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd}${xScale(x).toFixed(1)},${yScale(y).toFixed(1)}`;
    })
    .join(" ");
}

function buildBandPath(
  points: ProjPoint[],
  xScale: (v: number) => number,
  yScale: (v: number) => number
): string | null {
  if (points.length < 2) return null;

  const upper = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xScale(p.x).toFixed(1)},${yScale(p.max).toFixed(1)}`
    )
    .join(" ");
  const lower = [...points]
    .reverse()
    .map((p) => `L${xScale(p.x).toFixed(1)},${yScale(p.min).toFixed(1)}`)
    .join(" ");

  return `${upper} ${lower} Z`;
}

// ============================================================================
// TICK HELPERS
// ============================================================================

function buildYTicks([min, max]: [number, number]): number[] {
  const range = max - min;
  const step = range > 400 ? 100 : range > 200 ? 50 : 25;
  const ticks: number[] = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max; v += step) {
    ticks.push(v);
  }
  return ticks;
}

function buildXTicks([min, max]: [number, number]): number[] {
  const ticks: number[] = [0];
  const step = max - min > 16 ? 4 : 2;
  for (let v = step; v <= max; v += step) ticks.push(v);
  for (let v = -step; v >= min; v -= step) ticks.push(v);
  return ticks.sort((a, b) => a - b);
}

function formatWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return "Hoy";
  const abs = Math.abs(Math.round(weeksAgo));
  return `-${abs} sem`;
}
