"use client";

import { MAX_CAREER_INTERESTS } from "@/lib/student/constants";
import type { CareerPositionResult } from "@/lib/student/careerPositioning";
import { OfferingAutocomplete } from "./OfferingAutocomplete";
import type { GoalOption } from "./types";

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

function CareerPositionCard({
  interest,
  onRemove,
}: {
  interest: {
    offeringId: string;
    careerName: string;
    universityName: string;
    position: CareerPositionResult | null;
  };
  onRemove: () => void;
}) {
  const pos = interest.position;
  const border = pos ? statusColor(pos.status) : "border-gray-200";
  const label = statusLabel(pos);
  const progressPct =
    pos?.weightedScore != null && pos?.lastCutoff != null && pos.lastCutoff > 0
      ? Math.min(100, Math.round((pos.weightedScore / pos.lastCutoff) * 100))
      : null;

  return (
    <div className={`rounded-xl border p-4 space-y-2 transition-all ${border}`}>
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

      {progressPct !== null && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pos?.status === "above"
                ? "bg-emerald-500"
                : pos?.status === "near"
                  ? "bg-amber-500"
                  : "bg-red-400"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <p className={`text-xs font-medium ${label.color}`}>{label.text}</p>

      {pos?.lastCutoff != null && (
        <p className="text-[10px] text-gray-400">
          Último corte: {Math.round(pos.lastCutoff)} pts
          {pos.cutoffYear ? ` (${pos.cutoffYear})` : ""}
        </p>
      )}
    </div>
  );
}

export function CareerPositioningSection({
  careerInterests,
  options,
  onAddCareer,
  onRemoveCareer,
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
}) {
  const aboveCount = careerInterests.filter(
    (ci) => ci.position?.status === "above"
  ).length;

  return (
    <section className="card-section space-y-5">
      <div>
        <h2 className="text-xl font-serif font-semibold text-primary">
          ¿Dónde me posiciono?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Explora cómo tus objetivos te posicionan en distintas carreras.
        </p>
        {careerInterests.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Cumples para {aboveCount} de {careerInterests.length}{" "}
            {careerInterests.length === 1 ? "carrera" : "carreras"}
          </p>
        )}
      </div>

      {careerInterests.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-gray-200
            p-6 text-center"
        >
          <p className="text-sm text-gray-500">
            Agrega carreras de interés para ver cómo te posicionas con tus
            puntajes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {careerInterests.map((ci) => (
            <CareerPositionCard
              key={ci.offeringId}
              interest={ci}
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
