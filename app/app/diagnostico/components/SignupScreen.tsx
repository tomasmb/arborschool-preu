"use client";

import { useState, useEffect } from "react";

interface SignupScreenProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: "idle" | "loading" | "success" | "error";
  error: string;
  onSkip: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SignupScreen({
  email,
  onEmailChange,
  onSubmit,
  status,
  error,
  onSkip,
}: SignupScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations - matching landing */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div className="fixed top-20 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="fixed bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      {/* Dot pattern */}
      <div className="fixed inset-0 dot-pattern opacity-30" />

      <div className="relative z-10 max-w-md w-full">
        <div
          className={`card p-8 sm:p-12 text-center backdrop-blur-sm bg-white/90 transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Icon with glow */}
          <div className="relative inline-block mb-6">
            <div
              className={`absolute inset-0 bg-accent/20 rounded-full blur-xl transition-all duration-1000
                ${isFocused ? "scale-125 opacity-100" : "scale-100 opacity-60"}`}
            />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20">
              <svg
                className="w-10 h-10 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-3 transition-all duration-700 delay-100
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Guarda tus Resultados
          </h2>
          <p
            className={`text-cool-gray mb-8 transition-all duration-700 delay-200
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Ingresa tu email para guardar tu diagnóstico y recibir tu plan de
            estudio personalizado cuando esté listo.
          </p>

          <form
            onSubmit={onSubmit}
            className={`space-y-4 transition-all duration-700 delay-300
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="tu@email.com"
                className={`w-full px-5 py-4 rounded-xl border-2 bg-white text-charcoal 
                  placeholder:text-gray-400 focus:outline-none transition-all duration-300 text-base sm:text-lg text-center
                  ${
                    isFocused
                      ? "border-accent ring-4 ring-accent/10 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                disabled={status === "loading"}
              />

              {/* Animated border glow when focused */}
              {isFocused && (
                <div className="absolute inset-0 rounded-xl bg-accent/5 -z-10 blur-sm" />
              )}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

            <button
              type="submit"
              disabled={!email || status === "loading"}
              className="btn-cta w-full py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] 
                transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                <>
                  Guardar y Notificarme
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <button
            onClick={onSkip}
            className={`mt-6 text-cool-gray hover:text-charcoal transition-all duration-300 text-sm 
              hover:underline underline-offset-4 transition-all duration-700 delay-400
              ${isLoaded ? "opacity-100" : "opacity-0"}`}
          >
            Continuar sin guardar
          </button>
        </div>

        {/* Trust indicators */}
        <div
          className={`flex items-center justify-center gap-6 mt-8 text-cool-gray transition-all duration-700 delay-500
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center gap-2 text-xs">
            <svg
              className="w-4 h-4 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Datos seguros
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg
              className="w-4 h-4 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Sin spam
          </div>
        </div>
      </div>
    </div>
  );
}
