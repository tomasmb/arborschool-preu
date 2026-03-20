"use client";

import React from "react";
import type { ProjectionResult } from "./types";

const MIN_HOURS = 0.5;
const MAX_HOURS = 10;
const HOURS_STEP = 0.5;

export { MIN_HOURS, MAX_HOURS, HOURS_STEP };

function ProjectionCardInner({
  projection,
  hoursPerWeek,
  onChangeHours,
  allAtomsMastered,
  selectedMeta,
}: {
  projection: ProjectionResult;
  hoursPerWeek: number;
  onChangeHours: (value: number) => void;
  allAtomsMastered: boolean;
  selectedMeta: number | null;
}) {
  const minutesPerWeek = Math.round(hoursPerWeek * 60);
  const displayMeta = selectedMeta ?? projection.targetScore;
  const n = projection.weeksToTarget;
  const lastPoint = projection.points[projection.points.length - 1];
  const projectedScore = lastPoint?.projectedScoreMid ?? null;
  const hasProjection = projection.points.length > 0;

  const atMin = hoursPerWeek <= MIN_HOURS;
  const atMax = hoursPerWeek >= MAX_HOURS;

  return (
    <section className="card-section space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Ritmo de estudio
      </h2>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Horas por semana</label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={atMin}
            onClick={() => onChangeHours(hoursPerWeek - HOURS_STEP)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg",
              "text-lg font-semibold transition",
              atMin
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
            aria-label="Reducir horas"
          >
            −
          </button>

          <span className="min-w-[3.5rem] text-center text-lg font-semibold">
            {hoursPerWeek.toFixed(1)}h
          </span>

          <button
            type="button"
            disabled={atMax}
            onClick={() => onChangeHours(hoursPerWeek + HOURS_STEP)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg",
              "text-lg font-semibold transition",
              atMax
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
            aria-label="Aumentar horas"
          >
            +
          </button>
        </div>

        <p className="text-xs text-gray-400">{minutesPerWeek} min/semana</p>
      </div>

      <div className="space-y-4">
        {allAtomsMastered ? (
          <div
            className="rounded-xl bg-emerald-50 border border-emerald-100
              px-4 py-3"
          >
            <p className="text-sm font-medium text-emerald-800">
              ¡Has dominado todos los conceptos!
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Toma un test completo para validar tu puntaje final.
            </p>
          </div>
        ) : n ? (
          <div
            className="rounded-xl bg-emerald-50 border border-emerald-100
              px-4 py-3"
          >
            <p className="text-sm font-medium text-emerald-800">
              Alcanzas tu meta más alta en ~{n} {n === 1 ? "semana" : "semanas"}
            </p>
            {displayMeta && projectedScore && (
              <p className="text-xs text-emerald-600 mt-0.5">
                Puntaje proyectado a {projection.points.length} semanas:{" "}
                {projectedScore} (meta: {displayMeta})
              </p>
            )}
          </div>
        ) : hasProjection && projectedScore ? (
          <p className="text-sm text-gray-600">
            Puntaje proyectado a {projection.points.length} semanas:{" "}
            <span className="font-semibold">{projectedScore}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Completa un diagnóstico para ver tu proyección.
          </p>
        )}
      </div>
    </section>
  );
}

export const ProjectionCard = React.memo(ProjectionCardInner);
ProjectionCard.displayName = "ProjectionCard";
