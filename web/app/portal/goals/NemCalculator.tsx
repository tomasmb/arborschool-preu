"use client";

import { useRef, useState } from "react";
import { lookupNem, type SchoolType } from "@/lib/student/nemConversion";

type NemCalculatorProps = {
  nemValue: string;
  onUseNem: (value: string) => void;
};

const SCHOOL_TYPES: { value: SchoolType; label: string }[] = [
  { value: "CH", label: "C-H" },
  { value: "TP", label: "T-P" },
];

/**
 * Contextual micro-calculator that converts promedio de notas to NEM.
 * Zero-footprint: invisible when NEM already has a value, unless the
 * user explicitly opened it.
 */
export function NemCalculator({ nemValue, onUseNem }: NemCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [promedio, setPromedio] = useState("");
  const [schoolType, setSchoolType] = useState<SchoolType>("CH");
  const [usedOnce, setUsedOnce] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasNem = nemValue.trim().length > 0;
  const showTrigger = !hasNem || usedOnce;

  const parsed = parseFloat(promedio);
  const isValid = !isNaN(parsed) && parsed >= 4.0 && parsed <= 7.0;
  const nemResult = isValid ? lookupNem(parsed, schoolType) : null;

  function handleUse() {
    if (nemResult === null) return;
    onUseNem(String(nemResult));
    setUsedOnce(true);
    setOpen(false);
  }

  function handleOpen() {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handlePromedioChange(raw: string) {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setPromedio(cleaned);
  }

  if (!showTrigger && !open) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs text-gray-400 hover:text-primary
          transition-colors -mt-1"
      >
        {usedOnce ? "Recalcular NEM" : "¿No lo sabes? Calcular"}
      </button>
    );
  }

  return (
    <div
      className="rounded-xl border border-primary/15 bg-primary/[0.02]
        p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">
          Calculadora NEM
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar calculadora"
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

      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-[11px] text-gray-500 mb-1 block">
            Promedio de notas
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={promedio}
            onChange={(e) => handlePromedioChange(e.target.value)}
            placeholder="Ej: 6.2"
            className="w-full rounded-lg border border-gray-200 bg-white
              px-3 py-2 text-sm font-medium tabular-nums
              focus:border-primary focus:ring-2 focus:ring-primary/10
              focus:outline-none transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="shrink-0">
          <label className="text-[11px] text-gray-500 mb-1 block">
            Tipo
          </label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {SCHOOL_TYPES.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setSchoolType(st.value)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  schoolType === st.value
                    ? "bg-primary text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {nemResult !== null && (
        <div
          className="flex items-center justify-between rounded-lg
            bg-white border border-gray-100 px-3 py-2"
        >
          <div>
            <span className="text-[10px] text-gray-400 block">
              Tu NEM estimado
            </span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {nemResult}
            </span>
          </div>
          <button
            type="button"
            onClick={handleUse}
            className="rounded-full bg-primary text-white text-xs
              font-medium px-4 py-1.5 hover:bg-primary/90 transition-colors"
          >
            Usar
          </button>
        </div>
      )}

      <p className="text-[10px] text-gray-400 leading-snug">
        Tabla oficial DEMRE — Admisión 2026.
        {schoolType === "CH"
          ? " Grupo A: Humanístico-Científica Diurna."
          : " Grupo C: Técnico Profesional."}
      </p>
    </div>
  );
}
