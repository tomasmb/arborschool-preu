"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary for route segments.
 * Captures errors and reports them to Sentry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-cream to-off-white">
      <div className="card p-8 sm:p-12 text-center max-w-lg">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-serif font-bold text-charcoal mb-3">
          Algo salió mal
        </h1>
        <p className="text-cool-gray mb-6">
          Lo sentimos, ocurrió un error inesperado. Nuestro equipo ha sido
          notificado y lo solucionaremos pronto.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={reset} className="btn-cta px-8 py-3">
            Reintentar
          </button>
          <Link href="/" className="btn-ghost px-8 py-3">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
