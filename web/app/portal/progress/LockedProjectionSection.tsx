"use client";

import Link from "next/link";
import { PAES_TOTAL_QUESTIONS } from "@/lib/diagnostic/scoringConstants";

/**
 * Shown instead of the projection chart + hours slider when the student
 * has only completed the short diagnostic (no full 60-question test yet).
 * Communicates that the diagnostic is a starting point and the real
 * projection unlocks after a full test.
 */
export function LockedProjectionSection({
  currentScore,
}: {
  currentScore: { mid: number; min: number; max: number } | null;
}) {
  return (
    <section
      className="rounded-2xl border border-primary/20 bg-white
        overflow-hidden"
    >
      <div className="relative">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-lg font-serif font-semibold text-primary">
            Tu trayectoria de puntaje
          </h2>
        </div>
        <div className="relative h-48 mx-5 mt-3 mb-2 sm:mx-6 overflow-hidden">
          <GhostChart />
          <div
            className="absolute inset-0 flex items-center justify-center
              bg-white/70 backdrop-blur-[2px] rounded-xl"
          >
            <svg
              className="w-8 h-8 text-primary/30"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75
                  11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25
                  2.25 0 00-2.25-2.25H6.75a2.25 2.25 0
                  00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4">
        {currentScore && (
          <div className="flex items-baseline gap-2 text-sm text-gray-600">
            <span>Estimación preliminar:</span>
            <span className="font-semibold text-primary text-lg tabular-nums">
              {currentScore.mid}
            </span>
            <span className="text-xs text-gray-400">
              ({currentScore.min}–{currentScore.max})
            </span>
          </div>
        )}

        <div
          className="rounded-xl bg-primary/5 border border-primary/10
            p-4 space-y-3"
        >
          <p className="text-sm font-medium text-primary">
            Activa tu proyección personalizada
          </p>
          <p className="text-sm text-gray-600">
            El diagnóstico cubrió solo 16 preguntas para empezar a enseñarte de
            inmediato. Un test completo de {PAES_TOTAL_QUESTIONS} preguntas
            calibra tu puntaje real y desbloquea tu trayectoria de mejora semana
            a semana.
          </p>
          <ul className="grid gap-1.5 text-xs text-gray-500">
            <li className="flex items-center gap-2">
              <CheckIcon />
              Puntaje preciso basado en {PAES_TOTAL_QUESTIONS} preguntas
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Proyección personalizada con gráfico interactivo
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Conceptos ya dominados verificados automáticamente
            </li>
          </ul>
          <Link
            href="/portal/test"
            className="btn-cta inline-flex items-center gap-2
              text-sm py-3 px-5"
          >
            Tomar test completo
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <p className="text-xs text-gray-400">~2.5 horas · sin nota</p>
        </div>
      </div>
    </section>
  );
}

/** Decorative SVG chart silhouette rendered behind the lock overlay. */
function GhostChart() {
  return (
    <svg
      viewBox="0 0 400 140"
      className="w-full h-full text-gray-200"
      preserveAspectRatio="none"
    >
      {[0, 35, 70, 105, 140].map((y) => (
        <line
          key={y}
          x1={0}
          x2={400}
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}
      <path
        d="M0,100 Q100,90 160,70 T280,40 L400,20 L400,60
          Q320,70 280,80 T160,100 Q100,110 0,115 Z"
        fill="currentColor"
        opacity={0.3}
      />
      <path
        d="M0,105 Q100,95 160,80 T280,50 L400,30"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        opacity={0.5}
      />
      <line
        x1={0}
        x2={400}
        y1={60}
        y2={60}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="6 4"
        opacity={0.4}
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-primary shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
