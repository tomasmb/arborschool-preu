"use client";

/**
 * Mini-Form Screen (with integrated welcome content)
 *
 * Collects email, role (alumno/apoderado), and curso (3ro/4to/egresado)
 * BEFORE the test begins. This captures leads early so drop-offs
 * mid-test are still contactable.
 *
 * Includes essential welcome info (credibility badge, test details, tips)
 * to reduce funnel friction — this is the first screen students see.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoadingButton } from "@/app/components/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface MiniFormData {
  email: string;
  userType: "alumno" | "apoderado";
  curso: "3ro_medio" | "4to_medio" | "egresado" | "otro";
}

interface MiniFormScreenProps {
  onSubmit: (data: MiniFormData) => Promise<void>;
}

// ============================================================================
// OPTION CONFIGS
// ============================================================================

const USER_TYPE_OPTIONS = [
  { value: "alumno" as const, label: "Alumno/a" },
  { value: "apoderado" as const, label: "Apoderado/a" },
];

const CURSO_OPTIONS = [
  { value: "3ro_medio" as const, label: "3ro Medio" },
  { value: "4to_medio" as const, label: "4to Medio" },
  { value: "egresado" as const, label: "Egresado/a" },
];

// ============================================================================
// PILL SELECTOR COMPONENT
// ============================================================================

function PillSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium 
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

export function MiniFormScreen({ onSubmit }: MiniFormScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state — "Alumno/a" is default-checked since most users are students
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<MiniFormData["userType"]>("alumno");
  const [curso, setCurso] = useState<MiniFormData["curso"] | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const isFormValid = email && userType && curso;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit({ email, userType, curso });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 bg-gradient-to-b from-white via-cream to-off-white" />
      <div
        className="fixed top-10 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      {/* Dot pattern */}
      <div className="fixed inset-0 dot-pattern opacity-30" />

      {/* Back link — fixed top-left */}
      <Link
        href="/"
        className={`fixed top-4 left-4 z-20 inline-flex items-center gap-1.5
          text-sm text-charcoal font-medium bg-white/80 backdrop-blur-sm
          px-3 py-1.5 rounded-full shadow-sm border border-gray-100
          hover:bg-white hover:shadow transition-all duration-500
          ${isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Volver al inicio
      </Link>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo above card */}
        <div
          className={`text-center mb-6 transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
            <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
            <span className="text-xl font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        </div>

        {/* Main card */}
        <div
          className={`card p-8 sm:p-10 backdrop-blur-sm bg-white/90 transition-all duration-700 delay-100
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Title & credibility badge */}
          <div className="text-center mb-6">
            {/* Credibility badge */}
            <div
              className={`inline-flex items-center gap-2 text-sm text-cool-gray bg-primary/5 px-3 py-1.5 rounded-full mb-4
                transition-all duration-700 delay-150
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Basado en preguntas PAES oficiales
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2 
                transition-all duration-700 delay-150
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Prueba Diagnóstica PAES M1
            </h1>
            <p
              className={`text-cool-gray transition-all duration-700 delay-200
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              16 preguntas · ~15 min · Puntaje inmediato
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
            <div
              className={`transition-all duration-700 delay-250
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <label
                htmlFor="mini-form-email"
                className="block text-sm font-medium text-charcoal mb-2"
              >
                Email
              </label>
              <div className="relative">
                <input
                  id="mini-form-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="tu@email.com"
                  aria-describedby={error ? "mini-form-error" : undefined}
                  aria-invalid={error ? "true" : undefined}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-charcoal 
                    placeholder:text-gray-400 focus:outline-none transition-all duration-300
                    ${
                      isFocused
                        ? "border-primary ring-4 ring-primary/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* User type selector */}
            <div
              className={`transition-all duration-700 delay-300
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PillSelector
                label="Soy..."
                options={USER_TYPE_OPTIONS}
                value={userType}
                onChange={setUserType}
              />
            </div>

            {/* Curso selector: 3 main pills + secondary "otro" toggle */}
            <div
              className={`transition-all duration-700 delay-350
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PillSelector
                label="Curso"
                options={CURSO_OPTIONS}
                value={curso === "otro" ? null : curso}
                onChange={(v) => setCurso(v)}
              />
              <button
                type="button"
                onClick={() => setCurso("otro")}
                className={`mt-2 w-full text-xs text-center py-1.5 rounded-lg 
                  transition-all duration-200
                  ${
                    curso === "otro"
                      ? "text-primary font-semibold"
                      : "text-cool-gray hover:text-charcoal"
                  }`}
              >
                Estoy en otro curso
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div
                id="mini-form-error"
                role="alert"
                aria-live="polite"
                className="flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Collapsible tips for accurate results */}
            <details
              className={`bg-accent/5 border border-accent/20 rounded-xl p-4 text-left
                transition-all duration-700 delay-400
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <summary className="font-medium text-charcoal cursor-pointer flex items-center gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Tips para un diagnóstico preciso
              </summary>
              <ul className="mt-3 space-y-2 pl-6 text-sm text-cool-gray">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  Responde con honestidad — no hay nota, solo descubrimiento
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  Si no sabes la respuesta, usa el botón &quot;No lo sé&quot;
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  No puedes volver atrás — confía en tu primera intuición
                </li>
              </ul>
            </details>

            {/* Submit button */}
            <div
              className={`transition-all duration-700 delay-500
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <LoadingButton
                type="submit"
                disabled={!isFormValid}
                isLoading={isSubmitting}
                loadingText="Registrando..."
                className="btn-cta w-full py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] 
                  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Comenzar Diagnóstico
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

          {/* Trust microcopy */}
          <p
            className={`text-xs text-cool-gray text-center mt-4 max-w-sm mx-auto 
              transition-all duration-700 delay-600
              ${isLoaded ? "opacity-100" : "opacity-0"}`}
          >
            Te enviaremos tu reporte detallado y plan de estudio. No spam.
            Puedes borrar tu cuenta cuando quieras.
          </p>
        </div>
      </div>
    </div>
  );
}
