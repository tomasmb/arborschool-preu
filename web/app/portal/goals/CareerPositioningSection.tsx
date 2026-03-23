"use client";

import { useState } from "react";
import { MAX_CAREER_INTERESTS } from "@/lib/student/constants";
import type {
  CareerPositionResult,
  WeightBreakdownItem,
} from "@/lib/student/careerPositioning";
import { OfferingAutocomplete } from "./OfferingAutocomplete";
import type { GoalOption } from "./types";
import { testLabel } from "./utils";

function statusColor(status: CareerPositionResult["status"]) {
  switch (status) {
    case "above":
      return "border-emerald-200 bg-emerald-50/50";
    case "near":
      return "border-amber-200 bg-amber-50/50";
    case "below":
      return "border-red-200 bg-red-50/50";
    default:
      return "border-gray-200 bg-gray-50/50";
  }
}

function statusLabel(position: CareerPositionResult | null): {
  text: string;
  color: string;
} {
  if (!position || position.status === "incomplete") {
    return { text: "Ingresa tus puntajes para ver", color: "text-gray-400" };
  }
  if (position.margin === null) {
    return { text: "Sin datos de corte", color: "text-gray-400" };
  }
  if (position.status === "above") {
    return {
      text: `Cumples con margen (+${Math.round(position.margin)} pts)`,
      color: "text-emerald-700",
    };
  }
  if (position.status === "near") {
    return {
      text: `Cerca del corte (${Math.round(position.margin)} pts)`,
      color: "text-amber-700",
    };
  }
  return {
    text: `Te faltan ${Math.abs(Math.round(position.margin!))} pts`,
    color: "text-red-700",
  };
}

function PositionSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-1.5 rounded-full bg-gray-200" />
      <div className="h-3 w-32 rounded bg-gray-200" />
      <div className="h-2.5 w-24 rounded bg-gray-100" />
    </div>
  );
}

function formatBreakdownValue(value: number | null): string {
  if (value === null) return "--";
  return Math.round(value).toLocaleString("es-CL");
}

function WeightBreakdown({
  breakdown,
}: {
  breakdown: WeightBreakdownItem[];
}) {
  return (
    <div className="space-y-1 pt-1">
      <div
        className="grid grid-cols-[2fr_1fr_1fr_1fr] text-[10px]
          text-gray-400 font-medium px-1"
      >
        <span>Prueba</span>
        <span className="text-right">Peso</span>
        <span className="text-right">Puntaje</span>
        <span className="text-right">Aporte</span>
      </div>
      {breakdown.map((item) => (
        <div
          key={item.testCode}
          className={`grid grid-cols-[2fr_1fr_1fr_1fr] text-[11px]
            px-1 py-0.5 rounded ${
            item.score !== null
              ? "text-gray-700"
              : "text-gray-300"
          }`}
        >
          <span className="truncate font-medium">
            {testLabel(item.testCode)}
          </span>
          <span className="text-right tabular-nums">
            {item.weightPercent}%
          </span>
          <span className="text-right tabular-nums">
            {formatBreakdownValue(item.score)}
          </span>
          <span className="text-right tabular-nums">
            {formatBreakdownValue(item.contribution)}
          </span>
        </div>
      ))}
    </div>
  );
}

function WeightsOnlyBreakdown({
  weights,
}: {
  weights: { testCode: string; weightPercent: number }[];
}) {
  return (
    <div className="space-y-1 pt-1">
      <p className="text-[10px] text-gray-400 italic">
        Ingresa tus puntajes para ver el desglose
      </p>
      <div className="flex flex-wrap gap-1.5">
        {weights.map((w) => (
          <span
            key={w.testCode}
            className="text-[10px] text-gray-400 bg-gray-100 rounded-full
              px-2 py-0.5"
          >
            {testLabel(w.testCode)} {w.weightPercent}%
          </span>
        ))}
      </div>
    </div>
  );
}

function CareerPositionCard({
  interest,
  loading,
  refreshing,
  expanded,
  fallbackWeights,
  onToggle,
  onRemove,
}: {
  interest: {
    offeringId: string;
    careerName: string;
    universityName: string;
    position: CareerPositionResult | null;
  };
  loading?: boolean;
  refreshing?: boolean;
  expanded: boolean;
  fallbackWeights?: { testCode: string; weightPercent: number }[];
  onToggle: () => void;
  onRemove: () => void;
}) {
  const pos = interest.position;
  const border = pos ? statusColor(pos.status) : "border-gray-200";
  const label = statusLabel(pos);
  const progressPct =
    pos?.weightedScore != null
      && pos?.lastCutoff != null
      && pos.lastCutoff > 0
      ? Math.min(
          100,
          Math.round((pos.weightedScore / pos.lastCutoff) * 100)
        )
      : null;

  const showSkeleton = (loading && !pos) || refreshing;
  const hasBreakdown = pos && pos.breakdown.length > 0;

  return (
    <div
      className={
        `rounded-xl border p-4 space-y-2 transition-all cursor-pointer
        select-none ${border}`
      }
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-no-expand]")) return;
        onToggle();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {interest.careerName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {interest.universityName}
          </p>
        </div>
        <button
          type="button"
          data-no-expand
          onClick={onRemove}
          className="shrink-0 text-gray-400 hover:text-red-500
            transition-colors"
          aria-label="Quitar carrera"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {showSkeleton ? (
        <PositionSkeleton />
      ) : (
        <>
          {progressPct !== null && (
            <div
              className="h-1.5 rounded-full bg-gray-100 overflow-hidden"
            >
              <div
                className={
                  `h-full rounded-full transition-all duration-500 ${
                    pos?.status === "above"
                      ? "bg-emerald-500"
                      : pos?.status === "near"
                        ? "bg-amber-500"
                        : "bg-red-400"
                  }`
                }
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          <p className={`text-xs font-medium ${label.color}`}>
            {label.text}
          </p>

          {pos?.lastCutoff != null && (
            <p className="text-[10px] text-gray-400">
              Último corte: {Math.round(pos.lastCutoff)} pts
              {pos.cutoffYear ? ` (${pos.cutoffYear})` : ""}
            </p>
          )}

          {expanded && (
            <div className="pt-1 border-t border-gray-100 mt-1">
              {hasBreakdown ? (
                <WeightBreakdown breakdown={pos.breakdown} />
              ) : fallbackWeights && fallbackWeights.length > 0 ? (
                <WeightsOnlyBreakdown weights={fallbackWeights} />
              ) : null}
            </div>
          )}
        </>
      )}

      <div className="flex justify-center pt-0.5">
        <svg
          className={`w-4 h-4 text-gray-300 transition-transform
            duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export function CareerPositioningSection({
  careerInterests,
  options,
  onAddCareer,
  onRemoveCareer,
  saving,
  refreshing,
  error,
}: {
  careerInterests: Array<{
    offeringId: string;
    careerName: string;
    universityName: string;
    position: CareerPositionResult | null;
  }>;
  options: GoalOption[];
  onAddCareer: (offeringId: string) => void;
  onRemoveCareer: (offeringId: string) => void;
  saving?: boolean;
  refreshing?: boolean;
  error?: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const aboveCount = careerInterests.filter(
    (ci) => ci.position?.status === "above"
  ).length;

  const optionsByOfferingId = new Map(
    options.map((o) => [o.offeringId, o])
  );

  return (
    <section className="card-section space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-serif font-semibold text-primary">
            ¿Dónde me posiciono?
          </h2>
          {saving && (
            <span className="text-xs text-gray-400 animate-pulse">
              Guardando…
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Explora cómo tus objetivos te posicionan en distintas
          carreras.
        </p>
        {careerInterests.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Cumples para {aboveCount} de {careerInterests.length}{" "}
            {careerInterests.length === 1 ? "carrera" : "carreras"}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>

      {careerInterests.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-gray-200
            p-6 text-center"
        >
          <p className="text-sm text-gray-500">
            Agrega carreras de interés para ver cómo te posicionas
            con tus puntajes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {careerInterests.map((ci) => (
            <CareerPositionCard
              key={ci.offeringId}
              interest={ci}
              loading={saving}
              refreshing={refreshing}
              expanded={expandedId === ci.offeringId}
              fallbackWeights={
                optionsByOfferingId.get(ci.offeringId)?.weights
              }
              onToggle={() =>
                setExpandedId((prev) =>
                  prev === ci.offeringId ? null : ci.offeringId
                )
              }
              onRemove={() => onRemoveCareer(ci.offeringId)}
            />
          ))}
        </div>
      )}

      {careerInterests.length < MAX_CAREER_INTERESTS && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">
            Agregar carrera de interés
          </p>
          <OfferingAutocomplete
            options={options}
            selectedOfferingId=""
            onSelectOffering={onAddCareer}
            idPrefix="add-career"
          />
        </div>
      )}
    </section>
  );
}
