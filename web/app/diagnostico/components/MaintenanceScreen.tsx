"use client";

import Image from "next/image";
import Link from "next/link";

// ============================================================================
// MAINTENANCE SCREEN
// ============================================================================

/**
 * Full-page maintenance screen shown when the diagnostic test is unavailable.
 * Displayed after fatal errors or when questions fail to load after retries.
 */
export function MaintenanceScreen() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream to-off-white" />
      <div
        className="fixed top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg w-full">
        <div
          className="card p-8 sm:p-12 text-center backdrop-blur-sm bg-white/90"
          role="alert"
          aria-live="polite"
        >
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/logo-arbor.svg"
              alt="Arbor"
              width={48}
              height={48}
              className="mx-auto"
            />
          </div>

          {/* Maintenance icon */}
          <div className="relative inline-block mb-6" aria-hidden="true">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse-slow" />
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-200">
              <svg
                className="w-12 h-12 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-3">
            Estamos en mantenimiento
          </h1>
          <p className="text-cool-gray mb-4">
            El diagnóstico no está disponible en este momento.
          </p>
          <p className="text-sm text-cool-gray mb-8 max-w-sm mx-auto">
            Nuestro equipo está trabajando para solucionarlo. Por favor, intenta
            nuevamente en unos minutos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              aria-label="Reintentar cargar el diagnóstico"
              className="btn-cta px-8 py-3 flex items-center justify-center gap-2"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reintentar
            </button>
            <Link
              href="/"
              aria-label="Volver a la página de inicio"
              className="btn-ghost px-8 py-3 flex items-center justify-center gap-2"
            >
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
