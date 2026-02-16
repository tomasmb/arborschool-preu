"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/**
 * Saved results data from database.
 */
interface SavedResult {
  email: string;
  paesScoreMin: number;
  paesScoreMax: number;
  performanceTier: string;
  topRoute: {
    name: string;
    questionsUnlocked: number;
    pointsGain: number;
  } | null;
  createdAt: string;
}

/**
 * Saved Results Page
 *
 * Displays saved diagnostic results for a user.
 * URL: /resultados/[sessionId] where sessionId is the userId.
 */
export default function SavedResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [result, setResult] = useState<SavedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`/api/resultados/${sessionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Resultados no encontrados");
          } else {
            setError("Error al cargar los resultados");
          }
          return;
        }
        const data = await response.json();
        setResult(data);
      } catch {
        setError("Error al cargar los resultados");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchResults();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-white">
        <div className="animate-pulse text-cool-gray">Cargando...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-white p-4">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">
            {error || "Resultados no encontrados"}
          </h1>
          <p className="text-cool-gray mb-6">
            Es posible que este enlace haya expirado o no sea válido.
          </p>
          <Link href="/" className="btn-cta inline-block px-6 py-3">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const maskedEmail = maskEmail(result.email);
  const formattedDate = new Date(result.createdAt).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white p-4">
      {/* Background decorations */}
      <div className="fixed top-20 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/logo-arbor.svg"
            alt="Arbor"
            width={100}
            height={32}
            className="mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full text-sm font-medium">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Resultados guardados
          </div>
        </div>

        {/* Main Card */}
        <div className="card p-8">
          {/* Score */}
          <div className="text-center mb-6">
            <p className="text-sm text-cool-gray mb-1">
              Tu Puntaje PAES Estimado
            </p>
            <p className="text-5xl font-bold text-primary">
              {Math.round((result.paesScoreMin + result.paesScoreMax) / 2)}
            </p>
            <p className="text-sm text-cool-gray mt-2">
              Rango probable: {result.paesScoreMin}–{result.paesScoreMax}{" "}
              <span className="text-xs">(≈ ±5 preguntas)</span>
            </p>
          </div>

          {/* Route Card */}
          {result.topRoute && (
            <div className="bg-gradient-to-br from-cream to-off-white rounded-xl p-5 mb-6 border border-primary/10">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold mb-3">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                RUTA RECOMENDADA
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">
                {result.topRoute.name}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-cool-gray">
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
                  +{result.topRoute.questionsUnlocked} preguntas PAES
                </div>
                <div className="flex items-center gap-2 text-success font-semibold">
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  +{result.topRoute.pointsGain} puntos
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-cool-gray flex items-start gap-2">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
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
              <span>
                Te avisamos cuando la plataforma esté lista para continuar con
                tu ruta personalizada.
              </span>
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-cool-gray border-t border-gray-100 pt-4">
            <span>{maskedEmail}</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-sm text-cool-gray hover:text-charcoal transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Mask email for display (privacy).
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
