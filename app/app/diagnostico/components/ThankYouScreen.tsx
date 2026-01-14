"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Confetti } from "./Confetti";

interface ThankYouScreenProps {
  hasEmail: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ThankYouScreen({ hasEmail }: ThankYouScreenProps) {
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
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="fixed top-1/2 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />

      {/* Dot pattern */}
      <div className="fixed inset-0 dot-pattern opacity-30" />

      <div className="relative z-10 max-w-md w-full text-center">
        <div
          className={`card p-8 sm:p-12 backdrop-blur-sm bg-white/90 transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
        >
          {/* Celebration icon with glow and animation */}
          <div className="relative inline-block mb-6">
            <div
              className={`absolute inset-0 bg-success/30 rounded-full blur-xl transition-all duration-1000
                ${isLoaded ? "scale-150 opacity-100" : "scale-50 opacity-0"}`}
            />
            <div
              className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full 
                bg-gradient-to-br from-success/20 to-success/10 border-2 border-success/30
                transition-all duration-700 ${isLoaded ? "scale-100 rotate-0" : "scale-0 rotate-180"}`}
            >
              <svg
                className={`w-12 h-12 text-success transition-all duration-1000 delay-300
                  ${isLoaded ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
          </div>

          <h2
            className={`text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-4 transition-all duration-700 delay-200
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            ¡Increíble!
          </h2>

          {hasEmail ? (
            <>
              <p
                className={`text-lg text-cool-gray mb-6 transition-all duration-700 delay-300
                  ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                Tu diagnóstico está guardado. Te contactaremos muy pronto con tu
                plan de estudio personalizado.
              </p>
              <div
                className={`p-4 bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl mb-8
                  transition-all duration-700 delay-400 ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
              >
                <p className="text-success font-medium flex items-center justify-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Te avisaremos cuando tu plan esté listo
                </p>
              </div>
            </>
          ) : (
            <p
              className={`text-lg text-cool-gray mb-8 transition-all duration-700 delay-300
                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Gracias por completar el diagnóstico. Vuelve pronto para crear tu
              cuenta y ver tu plan personalizado.
            </p>
          )}

          <div
            className={`space-y-3 transition-all duration-700 delay-500
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

            <p className="text-sm text-cool-gray pt-2">
              Esta experiencia fue solo el comienzo
            </p>
          </div>
        </div>

        {/* Footer note with logo */}
        <div
          className={`mt-8 flex items-center justify-center gap-3 transition-all duration-700 delay-700
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
              Arbor PreU — Domina un concepto a la vez
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
