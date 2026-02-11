"use client";

/**
 * Mini-Form Screen
 *
 * Collects email, role (alumno/apoderado), and curso (3ro/4to/egresado)
 * BEFORE the test begins. This captures leads early so drop-offs
 * mid-test are still contactable.
 *
 * Design matches existing card style (white card, gradient bg, staggered animations).
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
  curso: "3ro_medio" | "4to_medio" | "egresado";
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

  // Form state
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<MiniFormData["userType"] | null>(
    null
  );
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

      <div className="relative z-10 max-w-md w-full">
        {/* Header with back link and logo */}
        <div
          className={`mb-6 transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal font-medium 
              bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100
              hover:bg-white hover:shadow transition-all mb-4"
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

          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
              <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
              <span className="text-xl font-serif font-bold text-primary">
                Arbor PreU
              </span>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div
          className={`card p-8 sm:p-10 backdrop-blur-sm bg-white/90 transition-all duration-700 delay-100
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="text-center mb-6">
            <h1
              className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2 
                transition-all duration-700 delay-150
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Antes de comenzar
            </h1>
            <p
              className={`text-cool-gray transition-all duration-700 delay-200
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Para personalizar tu diagnóstico y enviarte tu reporte
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

            {/* Curso selector */}
            <div
              className={`transition-all duration-700 delay-350
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PillSelector
                label="Curso"
                options={CURSO_OPTIONS}
                value={curso}
                onChange={setCurso}
              />
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

            {/* Submit button */}
            <div
              className={`transition-all duration-700 delay-400
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
              transition-all duration-700 delay-500
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
