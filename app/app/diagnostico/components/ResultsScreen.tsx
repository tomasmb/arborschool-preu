import React from "react";
import Image from "next/image";
import {
  AXIS_NAMES,
  SKILL_NAMES,
  ROUTE_NAMES,
  type Route,
  type Axis,
  type Skill,
} from "@/lib/diagnostic/config";

interface ResultsScreenProps {
  results: {
    paesMin: number;
    paesMax: number;
    level: string;
    axisPerformance: Record<
      Axis,
      { correct: number; total: number; percentage: number }
    >;
    skillPerformance: Record<
      Skill,
      { correct: number; total: number; percentage: number }
    >;
  };
  route: Route;
  totalCorrect: number;
  onSignup: () => void;
}

function getBarColor(percentage: number) {
  if (percentage >= 75) return "bg-success";
  if (percentage >= 50) return "bg-accent";
  return "bg-red-500";
}

function getWeakestAxisRecommendation(
  axisPerf: Record<Axis, { percentage: number }>
): string {
  const sorted = Object.entries(axisPerf).sort(
    (a, b) => a[1].percentage - b[1].percentage
  );
  const weakest = sorted[0];
  if (weakest[1].percentage >= 75) {
    return "¡Excelente base en todos los ejes! Enfócate en mantener tu nivel.";
  }
  return `Enfócate en <strong>${AXIS_NAMES[weakest[0] as Axis]}</strong> para mejorar tu puntaje más rápido.`;
}

function getWeakestSkillRecommendation(
  skillPerf: Record<Skill, { percentage: number }>
): string {
  const sorted = Object.entries(skillPerf).sort(
    (a, b) => a[1].percentage - b[1].percentage
  );
  const weakest = sorted[0];
  if (weakest[1].percentage >= 75) {
    return "Tus habilidades están bien equilibradas. Sigue practicando.";
  }
  return `Practica más ejercicios de <strong>${SKILL_NAMES[weakest[0] as Skill]}</strong>.`;
}

function RecommendationItem({ icon, text }: { icon: string; text: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    axis: (
      <svg
        className="w-5 h-5 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    skill: (
      <svg
        className="w-5 h-5 text-accent"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    plan: (
      <svg
        className="w-5 h-5 text-success"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{iconMap[icon]}</span>
      <p className="text-charcoal" dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

/**
 * Results screen with PAES score and performance breakdown
 */
export function ResultsScreen({
  results,
  route,
  totalCorrect,
  onSignup,
}: ResultsScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-off-white">
      {/* Header */}
      <div className="bg-primary text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <Image
              src="/logo-arbor.svg"
              alt="Arbor"
              width={40}
              height={40}
              className="brightness-0 invert"
            />
            <span className="text-xl font-serif font-bold">Arbor PreU</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold">
            Tu Diagnóstico PAES M1
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 -mt-4">
        {/* Score Card */}
        <div className="card p-8 mb-6 bg-gradient-to-br from-primary to-primary-light text-white text-center shadow-xl">
          <p className="text-white/80 text-sm uppercase tracking-wide mb-2">
            Puntaje Estimado
          </p>
          <p className="text-5xl sm:text-6xl font-bold mb-2">
            {results.paesMin} - {results.paesMax}
          </p>
          <div className="inline-block px-4 py-2 bg-white/20 rounded-full">
            <span className="font-medium">Nivel: {results.level}</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/20 flex justify-center gap-8">
            <div>
              <p className="text-2xl font-bold">{totalCorrect}/16</p>
              <p className="text-sm text-white/70">Correctas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{ROUTE_NAMES[route]}</p>
              <p className="text-sm text-white/70">Ruta asignada</p>
            </div>
          </div>
        </div>

        {/* Performance Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Axis Performance */}
          <div className="card p-6">
            <h2 className="text-lg font-serif font-bold text-charcoal mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Por Eje Temático
            </h2>
            <div className="space-y-4">
              {(Object.keys(results.axisPerformance) as Axis[]).map((axis) => {
                const data = results.axisPerformance[axis];
                return (
                  <div key={axis}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-charcoal font-medium">
                        {AXIS_NAMES[axis]}
                      </span>
                      <span className="text-sm font-bold text-charcoal">
                        {data.percentage}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(data.percentage)}`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Performance */}
          <div className="card p-6">
            <h2 className="text-lg font-serif font-bold text-charcoal mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Por Habilidad
            </h2>
            <div className="space-y-4">
              {(Object.keys(results.skillPerformance) as Skill[]).map(
                (skill) => {
                  const data = results.skillPerformance[skill];
                  return (
                    <div key={skill}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-charcoal font-medium">
                          {SKILL_NAMES[skill]}
                        </span>
                        <span className="text-sm font-bold text-charcoal">
                          {data.percentage}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getBarColor(data.percentage)}`}
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card p-6 mb-6 bg-amber-50 border-amber-200">
          <h2 className="text-lg font-serif font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Recomendaciones
          </h2>
          <div className="space-y-3">
            <RecommendationItem
              icon="axis"
              text={getWeakestAxisRecommendation(results.axisPerformance)}
            />
            <RecommendationItem
              icon="skill"
              text={getWeakestSkillRecommendation(results.skillPerformance)}
            />
            <RecommendationItem
              icon="plan"
              text="Con un plan personalizado de Arbor, podrías subir hasta 150 puntos en 12 semanas."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 text-center bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <h3 className="text-xl font-serif font-bold text-charcoal mb-2">
            ¿Listo para mejorar tu puntaje?
          </h3>
          <p className="text-cool-gray mb-6">
            Guarda tus resultados y te avisamos cuando tu plan de estudio
            personalizado esté listo.
          </p>
          <button onClick={onSignup} className="btn-cta px-10 py-4 text-lg">
            Guardar mis Resultados
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
