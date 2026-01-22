"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AXIS_NAMES, type Route, type Axis } from "@/lib/diagnostic/config";
import { Confetti } from "./Confetti";

// ============================================================================
// TYPES
// ============================================================================

interface AxisPerformance {
  correct: number;
  total: number;
  percentage: number;
}

interface ResultsScreenProps {
  results: {
    paesMin: number;
    paesMax: number;
    level: string;
    axisPerformance: Record<Axis, AxisPerformance>;
  };
  route: Route;
  totalCorrect: number;
  onSignup: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROUTE_DATA = {
  ALG: {
    titulo: "Dominio Algebraico",
    subtitulo: "Expresiones, reducción y operaciones",
    atomos: 8,
    desbloqueados: 12,
    puntosGanados: 45,
    horasEstudio: 2.5,
  },
  NUM: {
    titulo: "El Poder de los Números",
    subtitulo: "Enteros, fracciones y operaciones",
    atomos: 6,
    desbloqueados: 8,
    puntosGanados: 35,
    horasEstudio: 2,
  },
  GEO: {
    titulo: "El Ojo Geométrico",
    subtitulo: "Pitágoras, perímetros y áreas",
    atomos: 6,
    desbloqueados: 10,
    puntosGanados: 38,
    horasEstudio: 2,
  },
  PROB: {
    titulo: "El Arte de la Probabilidad",
    subtitulo: "Probabilidades y combinatoria",
    atomos: 5,
    desbloqueados: 7,
    puntosGanados: 28,
    horasEstudio: 1.5,
  },
};

const ATOM_COUNTS: Record<Axis, number> = { ALG: 80, NUM: 55, GEO: 43, PROB: 51 };
const TOTAL_ATOMS = 229;

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  star: (className: string) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  trendUp: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  target: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  book: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  unlock: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  clock: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lightbulb: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  trophy: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  algebra: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h8m-8 5h16" />
    </svg>
  ),
  numbers: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  geometry: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  probability: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

const AXIS_ICONS: Record<Axis, (className: string) => React.ReactNode> = {
  ALG: Icons.algebra,
  NUM: Icons.numbers,
  GEO: Icons.geometry,
  PROB: Icons.probability,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMotivationalMessage(
  axisPerformance: Record<Axis, AxisPerformance>
): { axis: Axis; axisName: string; percentage: number; message: string } {
  const sorted = Object.entries(axisPerformance).sort(
    (a, b) => b[1].percentage - a[1].percentage
  );
  const [strongestAxis, data] = sorted[0];
  const axis = strongestAxis as Axis;
  const percentage = data.percentage;

  const messages: Record<Axis, string> = {
    ALG: `El Álgebra es lo tuyo. Con ${percentage}% de dominio, tienes una base sólida.`,
    NUM: `Destacas en Números. Dominas el ${percentage}% — es tu fortaleza matemática.`,
    GEO: `Tienes ojo para la Geometría. ${percentage}% de dominio — ves las formas.`,
    PROB: `Eres fuerte en Probabilidad. ${percentage}% de dominio en datos y azar.`,
  };

  return { axis, axisName: AXIS_NAMES[axis], percentage, message: messages[axis] };
}

function calculateAtomsDominated(percentage: number, totalAtoms: number): number {
  return Math.round((percentage / 100) * totalAtoms);
}

function calculateTotalAtomsRemaining(axisPerformance: Record<Axis, AxisPerformance>): number {
  let totalDominated = 0;
  for (const axis of Object.keys(axisPerformance) as Axis[]) {
    totalDominated += calculateAtomsDominated(axisPerformance[axis].percentage, ATOM_COUNTS[axis]);
  }
  return TOTAL_ATOMS - totalDominated;
}

function calculatePotentialImprovement(axisPerformance: Record<Axis, AxisPerformance>): number {
  const sorted = Object.entries(axisPerformance).sort((a, b) => a[1].percentage - b[1].percentage);
  let totalGain = 0;
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    totalGain += ROUTE_DATA[sorted[i][0] as Axis].puntosGanados;
  }
  return totalGain;
}

function getWeeksByStudyTime(atomsRemaining: number) {
  const totalMinutes = atomsRemaining * 20;
  return {
    thirtyMin: Math.ceil(totalMinutes / 30 / 7),
    fortyFiveMin: Math.ceil(totalMinutes / 45 / 7),
    sixtyMin: Math.ceil(totalMinutes / 60 / 7),
  };
}

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

function AnimatedCounter({ target, duration = 2000, delay = 0 }: {
  target: number;
  duration?: number;
  delay?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    let animationFrame: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, started]);

  return <span>{count}</span>;
}

function AxisProgressBar({ axis, data, isStrength, isOpportunity, delay }: {
  axis: Axis;
  data: AxisPerformance;
  isStrength: boolean;
  isOpportunity: boolean;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const atomsDominated = calculateAtomsDominated(data.percentage, ATOM_COUNTS[axis]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getBarColor = (pct: number) => {
    if (pct >= 70) return "bg-gradient-to-r from-emerald-500 to-emerald-400";
    if (pct >= 50) return "bg-gradient-to-r from-amber-500 to-amber-400";
    return "bg-gradient-to-r from-primary to-primary-light";
  };

  return (
    <div className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-charcoal">{AXIS_NAMES[axis]}</span>
          {isStrength && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {Icons.star("w-3 h-3")} Fortaleza
            </span>
          )}
          {isOpportunity && (
            <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {Icons.trendUp("w-3 h-3")} Oportunidad
            </span>
          )}
        </div>
        <span className="text-sm text-cool-gray">{atomsDominated}/{ATOM_COUNTS[axis]} átomos</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(data.percentage)}`}
          style={{ width: isVisible ? `${data.percentage}%` : "0%" }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-sm font-semibold text-charcoal">{data.percentage}%</span>
      </div>
    </div>
  );
}

function RouteCard({ axis, isRecommended, delay }: {
  axis: Axis;
  isRecommended: boolean;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const route = ROUTE_DATA[axis];
  const AxisIcon = AXIS_ICONS[axis];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      ${isRecommended ? "ring-2 ring-accent ring-offset-2" : ""}`}>
      <div className={`card p-6 ${isRecommended ? "bg-gradient-to-br from-accent/5 to-white" : ""}`}>
        {isRecommended && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-4">
            {Icons.target("w-3.5 h-3.5")}
            Ruta Recomendada
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {AxisIcon("w-6 h-6 text-primary")}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-charcoal text-lg">{route.titulo}</h4>
            <p className="text-sm text-cool-gray mb-4">{route.subtitulo}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                {Icons.book("w-4 h-4 text-primary")}
                <span className="text-charcoal">{route.atomos} átomos</span>
              </div>
              <div className="flex items-center gap-2">
                {Icons.unlock("w-4 h-4 text-primary")}
                <span className="text-charcoal">+{route.desbloqueados} desbloqueados</span>
              </div>
              <div className="flex items-center gap-2">
                {Icons.trendUp("w-4 h-4 text-success")}
                <span className="text-success font-semibold">+{route.puntosGanados} pts PAES</span>
              </div>
              <div className="flex items-center gap-2">
                {Icons.clock("w-4 h-4 text-cool-gray")}
                <span className="text-cool-gray">~{route.horasEstudio} hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResultsScreen({ results, route: _route, totalCorrect, onSignup }: ResultsScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const motivational = getMotivationalMessage(results.axisPerformance);
  const potentialImprovement = calculatePotentialImprovement(results.axisPerformance);
  const atomsRemaining = calculateTotalAtomsRemaining(results.axisPerformance);
  const weeksByStudy = getWeeksByStudyTime(atomsRemaining);

  const sortedAxes = (Object.keys(results.axisPerformance) as Axis[]).sort(
    (a, b) => results.axisPerformance[b].percentage - results.axisPerformance[a].percentage
  );
  const strongestAxis = sortedAxes[0];
  const weakestAxis = sortedAxes[sortedAxes.length - 1];

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Confetti />
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="fixed bottom-20 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
            <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
            <span className="text-xl font-serif font-bold text-primary">Arbor PreU</span>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero Score */}
          <div className={`text-center mb-10 transition-all duration-700 
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Diagnóstico Completado
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-2">
              Tu Puntaje PAES Estimado
            </h1>
            <div className="text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light my-4">
              <AnimatedCounter target={midScore} duration={2500} delay={200} />
            </div>
            <div className="text-lg text-cool-gray mb-6">
              Rango: {results.paesMin} - {results.paesMax} puntos
            </div>
            <div className="card inline-block px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-amber-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                {Icons.star("w-5 h-5 text-amber-500")}
                <p className="text-lg text-charcoal font-medium">{motivational.message}</p>
              </div>
              <p className="text-sm text-cool-gray mt-2 flex items-center justify-center gap-1">
                {Icons.trendUp("w-4 h-4 text-success")}
                Con trabajo enfocado puedes subir <strong className="text-success ml-1">+{potentialImprovement} puntos</strong>
              </p>
            </div>
          </div>

          {/* Axis Performance */}
          <div className={`mb-10 transition-all duration-700 delay-300
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-6 text-center">
              Tu Perfil por Eje Temático
            </h2>
            <div className="card p-6 space-y-5">
              {sortedAxes.map((axis, index) => (
                <AxisProgressBar
                  key={axis}
                  axis={axis}
                  data={results.axisPerformance[axis]}
                  isStrength={axis === strongestAxis}
                  isOpportunity={axis === weakestAxis}
                  delay={600 + index * 150}
                />
              ))}
            </div>
          </div>

          {/* Learning Routes */}
          <div className={`mb-10 transition-all duration-700 delay-500
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-2 text-center">
              Rutas de Aprendizaje
            </h2>
            <p className="text-center text-cool-gray mb-6 text-sm">
              Caminos personalizados para maximizar tu mejora
            </p>
            <div className="space-y-4">
              <RouteCard axis={weakestAxis} isRecommended={true} delay={1000} />
              {sortedAxes.filter(a => a !== weakestAxis).slice(-2).map((axis, i) => (
                <RouteCard key={axis} axis={axis} isRecommended={false} delay={1200 + i * 150} />
              ))}
            </div>
            <div className="card p-4 mt-4 bg-primary/5 border-primary/20 flex items-center justify-center gap-2">
              {Icons.lightbulb("w-5 h-5 text-primary")}
              <p className="text-sm text-charcoal">
                <strong>Las rutas son acumulativas.</strong> Al terminar una, desbloqueas nuevos caminos.
              </p>
            </div>
          </div>

          {/* Maximum Potential */}
          <div className={`mb-10 transition-all duration-700 delay-700
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <h3 className="text-xl font-serif font-bold text-charcoal mb-4 flex items-center gap-2">
                {Icons.trophy("w-6 h-6 text-accent")}
                Tu Potencial Máximo
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-cool-gray mb-2">Átomos por dominar:</p>
                  <p className="text-3xl font-bold text-primary">{atomsRemaining}</p>
                  <p className="text-sm text-cool-gray mt-1">de {TOTAL_ATOMS} totales</p>
                </div>
                <div>
                  <p className="text-cool-gray mb-3">¿Cuánto tiempo toma?</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal">30 min/día</span>
                      <span className="font-semibold text-primary">~{weeksByStudy.thirtyMin} semanas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal">45 min/día</span>
                      <span className="font-semibold text-primary">~{weeksByStudy.fortyFiveMin} semanas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal">1 hora/día</span>
                      <span className="font-semibold text-primary">~{weeksByStudy.sixtyMin} semanas</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-cool-gray mt-4 text-center italic">
                No tienes que hacerlo todo de una vez. Cada átomo que dominas te acerca más a tu máximo potencial.
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className={`grid grid-cols-2 gap-4 mb-10 transition-all duration-700 delay-300
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="card p-5 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-3xl font-bold text-primary mb-1">{totalCorrect}/16</div>
              <div className="text-sm text-cool-gray font-medium">Respuestas Correctas</div>
            </div>
            <div className="card p-5 text-center bg-gradient-to-br from-success/5 to-success/10 border-success/20">
              <div className="text-3xl font-bold text-success mb-1">+{potentialImprovement}</div>
              <div className="text-sm text-cool-gray font-medium">Puntos Alcanzables</div>
            </div>
          </div>

          {/* CTA */}
          <div className={`transition-all duration-700 delay-1000
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-light p-8 text-center">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
              <div className="relative">
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
                  ¿Listo para mejorar tu puntaje?
                </h3>
                <p className="text-white/80 mb-6 max-w-md mx-auto">
                  Guarda tus resultados y te avisamos cuando tu plan de estudio personalizado esté listo.
                </p>
                <button onClick={onSignup} className="btn-cta px-10 py-4 text-lg shadow-xl hover:scale-105 transition-transform">
                  Guardar mis Resultados
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="text-white/60 text-sm mt-4">Te contactaremos muy pronto</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
