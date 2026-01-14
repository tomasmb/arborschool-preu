"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  AXIS_NAMES,
  SKILL_NAMES,
  ROUTE_NAMES,
  type Route,
  type Axis,
  type Skill,
} from "@/lib/diagnostic/config";
import { Confetti } from "./Confetti";

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// ANIMATED NUMBER COUNTER
// ============================================================================

function AnimatedCounter({
  target,
  duration = 2000,
  delay = 0,
}: {
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
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, started]);

  return <span>{count}</span>;
}

// ============================================================================
// CIRCULAR PROGRESS RING
// ============================================================================

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
  color,
  delay = 0,
  label,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  delay?: number;
  label: string;
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-charcoal">
            {Math.round(animatedPercentage)}%
          </span>
        </div>
      </div>
      <span className="text-sm text-cool-gray text-center font-medium max-w-[100px]">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// SCORE GAUGE VISUALIZATION
// ============================================================================

function ScoreGauge({
  min,
  max,
  level,
}: {
  min: number;
  max: number;
  level: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // PAES range is 100-1000 (900 point range)
  const scoreToPercent = (score: number) => ((score - 100) / 900) * 100;
  const minPosition = scoreToPercent(min);
  const maxPosition = scoreToPercent(max);
  const midPosition = (minPosition + maxPosition) / 2;

  // Labels with their actual positions on the scale
  const labels = [
    { score: 100, position: 0 },
    { score: 300, position: scoreToPercent(300) },
    { score: 500, position: scoreToPercent(500) },
    { score: 700, position: scoreToPercent(700) },
    { score: 900, position: scoreToPercent(900) },
    { score: 1000, position: 100 },
  ];

  return (
    <div className="relative mt-8 mb-4 pt-14">
      {/* Level badge - positioned at the center of the score range */}
      <div
        className={`absolute top-0 -translate-x-1/2 transition-all duration-700 delay-500
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ left: `${midPosition}%` }}
      >
        <div className="px-4 py-1.5 bg-white rounded-full shadow-lg border border-accent/20">
          <span className="text-sm font-bold text-accent">{level}</span>
        </div>
      </div>

      {/* Gauge background with gradient */}
      <div className="h-4 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-50% to-green-400 opacity-30" />

      {/* Score range indicator */}
      <div
        className={`absolute top-14 h-4 rounded-full bg-gradient-to-r from-accent to-accent-light shadow-lg 
          transition-all duration-1000 ease-out ${isVisible ? "opacity-100" : "opacity-0 scale-x-0"}`}
        style={{
          left: `${minPosition}%`,
          width: `${Math.max(maxPosition - minPosition, 2)}%`,
          transformOrigin: "left",
        }}
      />

      {/* Score labels - positioned at their actual scale positions */}
      <div className="relative mt-2 h-5">
        {labels.map(({ score, position }) => (
          <span
            key={score}
            className="absolute text-xs text-cool-gray -translate-x-1/2"
            style={{ left: `${position}%` }}
          >
            {score}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// RECOMMENDATION CARD
// ============================================================================

function RecommendationCard({
  icon,
  title,
  text,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: string;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm
        transition-all duration-500 hover:shadow-md hover:-translate-y-1
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-charcoal mb-1">{title}</h4>
        <p
          className="text-cool-gray text-sm"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getWeakestAxisRecommendation(
  axisPerf: Record<Axis, { percentage: number }>
): { title: string; text: string } {
  const sorted = Object.entries(axisPerf).sort(
    (a, b) => a[1].percentage - b[1].percentage
  );
  const weakest = sorted[0];
  if (weakest[1].percentage >= 75) {
    return {
      title: "Base sólida",
      text: "¡Excelente! Tienes buena base en todos los ejes. Enfócate en mantener tu nivel.",
    };
  }
  return {
    title: "Eje prioritario",
    text: `Enfócate en <strong>${AXIS_NAMES[weakest[0] as Axis]}</strong> para mejorar tu puntaje más rápido.`,
  };
}

function getWeakestSkillRecommendation(
  skillPerf: Record<Skill, { percentage: number }>
): { title: string; text: string } {
  const sorted = Object.entries(skillPerf).sort(
    (a, b) => a[1].percentage - b[1].percentage
  );
  const weakest = sorted[0];
  if (weakest[1].percentage >= 75) {
    return {
      title: "Habilidades equilibradas",
      text: "Tus habilidades están bien equilibradas. Sigue practicando para mantener el nivel.",
    };
  }
  return {
    title: "Habilidad a desarrollar",
    text: `Practica más ejercicios de <strong>${SKILL_NAMES[weakest[0] as Skill]}</strong>.`,
  };
}

function getProgressColor(percentage: number): string {
  if (percentage >= 75) return "#059669";
  if (percentage >= 50) return "#d97706";
  return "#dc2626";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResultsScreen({
  results,
  route,
  totalCorrect,
  onSignup,
}: ResultsScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const axisRec = getWeakestAxisRecommendation(results.axisPerformance);
  const skillRec = getWeakestSkillRecommendation(results.skillPerformance);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Confetti celebration */}
      <Confetti />

      {/* Background decorations - matching landing */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="fixed bottom-20 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="fixed top-1/2 right-0 w-64 h-64 bg-success/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
            <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
            <span className="text-xl font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero Score Section */}
          <div
            className={`text-center mb-12 transition-all duration-700 
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Diagnóstico Completado
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-8">
              Tu Puntaje PAES Estimado
            </h1>

            {/* Main Score Display */}
            <div className="relative inline-block">
              <div className="text-7xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                <AnimatedCounter
                  target={midScore}
                  duration={2500}
                  delay={200}
                />
              </div>
              <div className="text-xl text-cool-gray mt-2">
                Rango: {results.paesMin} - {results.paesMax}
              </div>
            </div>

            {/* Score Gauge */}
            <div className="max-w-xl mx-auto mt-12 px-4">
              <ScoreGauge
                min={results.paesMin}
                max={results.paesMax}
                level={results.level}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div
            className={`grid grid-cols-2 gap-4 mb-10 transition-all duration-700 delay-300
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="card p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-4xl font-bold text-primary mb-1">
                {totalCorrect}/16
              </div>
              <div className="text-sm text-cool-gray font-medium">
                Respuestas Correctas
              </div>
            </div>
            <div className="card p-6 text-center bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <div className="text-3xl font-bold text-accent mb-1">
                {ROUTE_NAMES[route]}
              </div>
              <div className="text-sm text-cool-gray font-medium">
                Ruta Asignada
              </div>
            </div>
          </div>

          {/* Performance Section */}
          <div
            className={`mb-10 transition-all duration-700 delay-500
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-6 text-center">
              Tu Desempeño por Área
            </h2>

            {/* Axis Performance - Circular Progress */}
            <div className="card p-8 mb-6">
              <h3 className="text-lg font-bold text-charcoal mb-6 flex items-center gap-2">
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
              </h3>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                {(Object.keys(results.axisPerformance) as Axis[]).map(
                  (axis, index) => {
                    const data = results.axisPerformance[axis];
                    return (
                      <CircularProgress
                        key={axis}
                        percentage={data.percentage}
                        color={getProgressColor(data.percentage)}
                        delay={800 + index * 150}
                        label={AXIS_NAMES[axis]}
                      />
                    );
                  }
                )}
              </div>
            </div>

            {/* Skill Performance - Circular Progress */}
            <div className="card p-8">
              <h3 className="text-lg font-bold text-charcoal mb-6 flex items-center gap-2">
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
              </h3>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                {(Object.keys(results.skillPerformance) as Skill[]).map(
                  (skill, index) => {
                    const data = results.skillPerformance[skill];
                    return (
                      <CircularProgress
                        key={skill}
                        percentage={data.percentage}
                        color={getProgressColor(data.percentage)}
                        delay={1200 + index * 150}
                        label={SKILL_NAMES[skill]}
                      />
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div
            className={`mb-10 transition-all duration-700 delay-700
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-6 text-center">
              Recomendaciones Personalizadas
            </h2>

            <div className="space-y-4">
              <RecommendationCard
                icon={
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
                }
                title={axisRec.title}
                text={axisRec.text}
                color="#0b3a5b"
                delay={1600}
              />
              <RecommendationCard
                icon={
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
                }
                title={skillRec.title}
                text={skillRec.text}
                color="#d97706"
                delay={1800}
              />
              <RecommendationCard
                icon={
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
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                }
                title="Tu potencial"
                text="Con un plan personalizado de Arbor, podrías <strong>subir hasta 150 puntos</strong> en 12 semanas."
                color="#059669"
                delay={2000}
              />
            </div>
          </div>

          {/* CTA Section */}
          <div
            className={`transition-all duration-700 delay-1000
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-light p-8 sm:p-10 text-center">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />

              <div className="relative">
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
                  ¿Listo para mejorar tu puntaje?
                </h3>
                <p className="text-white/80 mb-8 max-w-md mx-auto">
                  Guarda tus resultados y te avisamos cuando tu plan de estudio
                  personalizado esté listo.
                </p>

                <button
                  onClick={onSignup}
                  className="btn-cta px-10 py-5 text-lg shadow-xl hover:scale-105 transition-transform"
                >
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

                <p className="text-white/60 text-sm mt-4">
                  Te contactaremos muy pronto
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
