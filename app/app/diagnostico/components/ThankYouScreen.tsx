"use client";

/**
 * Thank You Screen (Skippers Only)
 *
 * This screen is ONLY shown to users who SKIP the signup process.
 * Users who sign up see the full ResultsScreen as their endpoint.
 *
 * Purpose:
 * - Provide closure for users who chose not to sign up
 * - Offer a second chance to reconsider and save their results
 * - Thank them for participating
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Confetti } from "./Confetti";

interface ThankYouScreenProps {
  /** Callback for users who skipped but want to reconsider and sign up */
  onReconsider?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ThankYouScreen({ onReconsider }: ThankYouScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Celebration particles - burst variant */}
      <Confetti variant="burst" duration={3000} particleCount={60} />

      {/* Background decorations */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div className="fixed top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-accent/10 rounded-full blur-3xl" />

      {/* Dot pattern */}
      <div className="fixed inset-0 dot-pattern opacity-30" />

      <div className="relative z-10 max-w-md w-full text-center">
        <div
          className={`card p-8 sm:p-12 backdrop-blur-sm bg-white/90 transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
        >
          {/* Thank you icon */}
          <div className="relative inline-block mb-6">
            <div
              className={`absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all duration-1000
                ${isLoaded ? "scale-150 opacity-100" : "scale-50 opacity-0"}`}
            />
            <div
              className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full 
                bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20
                transition-all duration-700 ${isLoaded ? "scale-100 rotate-0" : "scale-0 rotate-180"}`}
            >
              <svg
                className={`w-10 h-10 text-primary transition-all duration-1000 delay-300
                  ${isLoaded ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
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

          <h2
            className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-4 transition-all duration-700 delay-200
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            ¡Gracias por participar!
          </h2>

          <p
            className={`text-cool-gray mb-6 transition-all duration-700 delay-300
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Completaste el diagnóstico. Vuelve cuando quieras para ver tu plan
            personalizado y comenzar a mejorar.
          </p>

          {/* Second-chance CTA for users who skipped - more prominent */}
          {onReconsider && (
            <div
              className={`mb-6 transition-all duration-700 delay-350
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <button
                onClick={onReconsider}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl
                  text-base font-semibold text-primary bg-primary/10 border border-primary/20
                  hover:bg-primary/20 hover:border-primary/30 transition-all duration-300"
              >
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
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                Ver mis resultados completos
              </button>
              <p className="text-xs text-cool-gray mt-2">
                Solo necesitas tu email para desbloquear
              </p>
            </div>
          )}

          {/* Home link */}
          <div
            className={`space-y-3 transition-all duration-700 delay-400
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Link
              href="/"
              className="btn-cta w-full py-4 text-lg inline-flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              Volver al Inicio
              <svg
                className="w-5 h-5 ml-2"
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

        {/* Footer note with logo */}
        <div
          className={`mt-8 flex items-center justify-center gap-3 transition-all duration-700 delay-500
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
            <span className="text-sm text-cool-gray font-medium">
              Arbor PreU — Una mini-clase a la vez
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
