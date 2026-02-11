"use client";

/**
 * Thank You Screen
 *
 * Shown after a student confirms they want to exit without filling
 * the profiling form. Displays their score (earned by completing the
 * diagnostic) and a clean goodbye with a link back to home.
 *
 * No upsell, no false promises — just a genuine thank you.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface ThankYouScreenProps {
  /** PAES mid-score to display */
  score: number | null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ThankYouScreen({ score }: ThankYouScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations — matches other screens */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div
        className="fixed top-20 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-md w-full">
        <div
          className={`card p-8 sm:p-10 text-center backdrop-blur-sm bg-white/90 
            transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Success icon */}
          <div className="relative inline-block mb-4">
            <div
              className={`absolute inset-0 bg-success/20 rounded-full blur-xl 
                transition-all duration-1000
                ${isLoaded ? "scale-125 opacity-80" : "scale-100 opacity-0"}`}
            />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-success/20 to-success/10 border border-success/20">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <h2
            className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2
              transition-all duration-700 delay-100
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            ¡Gracias por completar el diagnóstico!
          </h2>

          {/* Score display */}
          {score && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 my-4 rounded-full 
                bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20
                transition-all duration-700 delay-200
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <span className="text-sm text-cool-gray">Tu puntaje:</span>
              <span className="text-lg font-bold text-primary">{score}</span>
              <span className="text-sm text-cool-gray">pts</span>
            </div>
          )}

          {/* Message */}
          <p
            className={`text-sm text-cool-gray mt-2 mb-8 transition-all duration-700 delay-300
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Tu esfuerzo cuenta. Esperamos verte pronto.
          </p>

          {/* CTA — back to home (honest label) */}
          <div
            className={`transition-all duration-700 delay-400
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Link
              href="/"
              className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              Volver al inicio
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>
          </div>
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
