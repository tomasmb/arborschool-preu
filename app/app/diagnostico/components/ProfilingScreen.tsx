"use client";

/**
 * Profiling Screen
 *
 * Optional profiling step shown after partial results.
 * Collects: meta puntaje PAES, fecha PAES, en preu, tipo colegio.
 *
 * Replaces the old SignupScreen in the flow. Unlike the old flow,
 * the user's email is already captured — this is a "personalize your plan"
 * step with a de-emphasized skip link.
 *
 * All fields are optional. Submit sends whatever was filled.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { LoadingButton } from "@/app/components/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface ProfilingData {
  paesGoal?: string;
  paesDate?: string;
  inPreu?: boolean;
  schoolType?: string;
}

interface ProfilingScreenProps {
  /** User's estimated PAES score to display as a reminder */
  score?: number;
  /** Handler for submitting profiling data */
  onSubmit: (data: ProfilingData) => Promise<void>;
  /** Handler for skipping profiling */
  onSkip: () => void;
}

// ============================================================================
// OPTION CONFIGS
// ============================================================================

const PAES_GOAL_OPTIONS = [
  { value: "500-600", label: "500-600" },
  { value: "600-700", label: "600-700" },
  { value: "700+", label: "700+" },
];

const PAES_DATE_OPTIONS = [
  { value: "este_ano", label: "Este año" },
  { value: "proximo", label: "Próximo año" },
  { value: "no_se", label: "No sé" },
];

const IN_PREU_OPTIONS = [
  { value: "true", label: "Sí" },
  { value: "false", label: "No" },
];

const SCHOOL_TYPE_OPTIONS = [
  { value: "municipal", label: "Municipal" },
  { value: "subvencionado", label: "Subvencionado" },
  { value: "privado", label: "Privado" },
];

// ============================================================================
// PILL SELECTOR COMPONENT
// ============================================================================

function PillSelector({
  label,
  sublabel,
  options,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1">
        {label}
        {sublabel && (
          <span className="text-xs text-cool-gray font-normal ml-1">
            {sublabel}
          </span>
        )}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium 
              border-2 transition-all duration-200
              ${
                value === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 bg-white text-cool-gray hover:border-gray-300"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProfilingScreen({
  score,
  onSubmit,
  onSkip,
}: ProfilingScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All fields are optional — start as null
  const [paesGoal, setPaesGoal] = useState<string | null>(null);
  const [paesDate, setPaesDate] = useState<string | null>(null);
  const [inPreu, setInPreu] = useState<string | null>(null);
  const [schoolType, setSchoolType] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        paesGoal: paesGoal ?? undefined,
        paesDate: paesDate ?? undefined,
        inPreu: inPreu !== null ? inPreu === "true" : undefined,
        schoolType: schoolType ?? undefined,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div
        className="fixed top-20 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      {/* Dot pattern */}
      <div className="fixed inset-0 dot-pattern opacity-30" />

      <div className="relative z-10 max-w-md w-full">
        <div
          className={`card p-8 sm:p-10 text-center backdrop-blur-sm bg-white/90 
            transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Header icon */}
          <div className="relative inline-block mb-4">
            <div
              className={`absolute inset-0 bg-accent/20 rounded-full blur-xl 
                transition-all duration-1000
                ${isLoaded ? "scale-125 opacity-80" : "scale-100 opacity-0"}`}
            />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-1
              transition-all duration-700 delay-100
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Personaliza tu plan
          </h2>

          <p
            className={`text-sm text-cool-gray mb-2 transition-all duration-700 delay-150
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            30 segundos — todo es opcional
          </p>

          {/* Score reminder badge */}
          {score && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-full 
                bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20
                transition-all duration-700 delay-200
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <span className="text-sm text-cool-gray">Tu puntaje:</span>
              <span className="text-lg font-bold text-primary">{score}</span>
              <span className="text-sm text-cool-gray">pts</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Meta puntaje PAES */}
            <div
              className={`transition-all duration-700 delay-250
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PillSelector
                label="Meta puntaje PAES"
                sublabel="(opcional)"
                options={PAES_GOAL_OPTIONS}
                value={paesGoal}
                onChange={setPaesGoal}
              />
            </div>

            {/* Fecha PAES */}
            <div
              className={`transition-all duration-700 delay-300
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PillSelector
                label="¿Cuándo das la PAES?"
                sublabel="(opcional)"
                options={PAES_DATE_OPTIONS}
                value={paesDate}
                onChange={setPaesDate}
              />
            </div>

            {/* En Preu */}
            <div
              className={`transition-all duration-700 delay-350
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PillSelector
                label="¿Estás en un preu?"
                sublabel="(opcional)"
                options={IN_PREU_OPTIONS}
                value={inPreu}
                onChange={setInPreu}
              />
            </div>

            {/* Tipo de colegio */}
            <div
              className={`transition-all duration-700 delay-400
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PillSelector
                label="Tipo de colegio"
                sublabel="(opcional)"
                options={SCHOOL_TYPE_OPTIONS}
                value={schoolType}
                onChange={setSchoolType}
              />
            </div>

            {/* Submit CTA */}
            <div
              className={`pt-2 transition-all duration-700 delay-500
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Guardando..."
                className="btn-cta w-full py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] 
                  transition-all duration-300"
              >
                Ver mis resultados detallados
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </LoadingButton>
            </div>
          </form>

          {/* De-emphasized skip link */}
          <button
            onClick={onSkip}
            aria-label="Saltar y ver resultados"
            className={`mt-6 text-xs text-gray-400 hover:text-gray-500 transition-colors
              ${isLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "600ms" }}
          >
            Saltar y ver resultados
          </button>
        </div>

        {/* Footer with explanation */}
        <div
          className={`flex items-center justify-center mt-6 transition-all duration-700 delay-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm">
            <Image
              src="/logo-arbor.svg"
              alt="Arbor"
              width={20}
              height={20}
              className="opacity-70"
            />
            <span className="text-xs text-cool-gray">
              Usamos estos datos para recomendarte mejor
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
