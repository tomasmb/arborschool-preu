"use client";

/**
 * Confirm Skip Screen
 *
 * Shown when a student tries to exit without completing the profiling form.
 * Clearly explains what they'll miss (question review, learning routes)
 * and gives them two honest options:
 * - "Completar las 4 preguntas" → goes to profiling
 * - "Confirmar salida" → exits to thank-you screen
 */

import { useState, useEffect } from "react";
import Image from "next/image";

// ============================================================================
// TYPES
// ============================================================================

interface ConfirmSkipScreenProps {
  /** Handler for "Completar las 4 preguntas" — back to profiling */
  onBackToProfiling: () => void;
  /** Handler for "Confirmar salida" — exit to thank-you */
  onConfirmExit: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/** X-circle icon for the "what you'll miss" bullet list */
function MissIcon() {
  return (
    <svg
      className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConfirmSkipScreen({
  onBackToProfiling,
  onConfirmExit,
}: ConfirmSkipScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations — matches other screens */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div
        className="fixed top-20 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-md w-full">
        <div
          className={`card p-8 sm:p-10 text-center backdrop-blur-sm bg-white/90 
            transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Warning icon */}
          <div className="relative inline-block mb-4">
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200">
              <svg
                className="w-8 h-8 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <h2
            className={`text-xl sm:text-2xl font-serif font-bold text-charcoal mb-6
              transition-all duration-700 delay-100
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Si sales ahora no podrás ver:
          </h2>

          {/* What they'll miss */}
          <div
            className={`text-left space-y-3 mb-8 transition-all duration-700 delay-200
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="flex items-start gap-3 p-3 bg-red-50/50 rounded-xl">
              <MissIcon />
              <span className="text-sm text-charcoal">
                Qué respuestas tuviste correctas e incorrectas
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50/50 rounded-xl">
              <MissIcon />
              <span className="text-sm text-charcoal">
                Rutas de aprendizaje recomendadas para ti
              </span>
            </div>
          </div>

          {/* Primary CTA — back to profiling (honest label) */}
          <div
            className={`transition-all duration-700 delay-300
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={onBackToProfiling}
              className="btn-cta w-full py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] 
                transition-all duration-300 flex items-center justify-center gap-2"
            >
              Completar las 4 preguntas
              <svg
                className="w-5 h-5"
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
            </button>

            <p className="text-xs text-cool-gray mt-3">
              Menos de 30 segundos · Todo es opcional
            </p>
          </div>

          {/* Secondary — confirm exit (honest label) */}
          <button
            onClick={onConfirmExit}
            className={`mt-6 text-xs text-gray-400 hover:text-gray-500 transition-colors
              ${isLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "400ms" }}
          >
            Confirmar salida
          </button>
        </div>

        {/* Footer branding */}
        <div
          className={`flex items-center justify-center mt-6 transition-all duration-700 delay-500
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
            <span className="text-xs text-cool-gray">Arbor PreU</span>
          </div>
        </div>
      </div>
    </div>
  );
}
