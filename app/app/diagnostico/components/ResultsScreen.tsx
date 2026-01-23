"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { type Route, type Axis, type MSTQuestion } from "@/lib/diagnostic/config";
import { Confetti } from "./Confetti";
import { Icons, AnimatedCounter } from "./shared";
import { useLearningRoutes, sortRoutesByImpact } from "../hooks/useLearningRoutes";
import { QuestionReviewDrawer, type ResponseForReview } from "./QuestionReviewDrawer";
import {
  AxisProgressBar,
  RouteCard,
  getMotivationalMessage,
  calculateTotalAtomsRemaining,
  getWeeksByStudyTime,
  TOTAL_ATOMS,
  type AxisPerformance,
} from "./ResultsComponents";

// ============================================================================
// TYPES
// ============================================================================

/** Atom mastery result from diagnostic */
export interface AtomResult {
  atomId: string;
  mastered: boolean;
}

/** Response data for question review */
export interface DiagnosticResponse {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
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
  /** Atom mastery results from diagnostic for computing learning routes */
  atomResults?: AtomResult[];
  /** All responses from diagnostic for question review */
  responses?: DiagnosticResponse[];
  onSignup: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResultsScreen({
  results,
  route: _route,
  totalCorrect,
  atomResults = [],
  responses = [],
  onSignup,
}: ResultsScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const motivational = getMotivationalMessage(results.axisPerformance);
  const atomsRemaining = calculateTotalAtomsRemaining(results.axisPerformance);
  const weeksByStudy = getWeeksByStudyTime(atomsRemaining);

  // Prepare responses for review drawer
  const responsesForReview: ResponseForReview[] = useMemo(() => {
    return responses.map((r) => ({
      question: r.question,
      selectedAnswer: r.selectedAnswer,
      isCorrect: r.isCorrect,
    }));
  }, [responses]);

  // Fetch personalized learning routes based on diagnostic atom results
  const { data: routesData, isLoading: routesLoading } = useLearningRoutes(atomResults);

  // Sort routes by impact and memoize
  const sortedRoutes = useMemo(() => {
    if (!routesData?.routes) return [];
    return sortRoutesByImpact(routesData.routes);
  }, [routesData?.routes]);

  // Calculate potential improvement from actual route data
  const potentialImprovement = useMemo(() => {
    if (routesData?.improvement) {
      return Math.round((routesData.improvement.minPoints + routesData.improvement.maxPoints) / 2);
    }
    // Fallback based on low-hanging fruit
    return sortedRoutes.slice(0, 3).reduce((sum, r) => sum + r.pointsGain, 0);
  }, [routesData?.improvement, sortedRoutes]);

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
            {routesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {sortedRoutes.slice(0, 3).map((route, i) => (
                  <RouteCard
                    key={route.axis}
                    route={route}
                    isRecommended={i === 0}
                    delay={1000 + i * 150}
                  />
                ))}
              </div>
            )}
            {routesData?.lowHangingFruit && (
              <div className="card p-4 mt-4 bg-success/5 border-success/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {Icons.lightbulb("w-5 h-5 text-success")}
                  <p className="text-sm font-medium text-charcoal">Preguntas cerca de desbloquear</p>
                </div>
                <p className="text-center text-sm text-cool-gray">
                  <strong className="text-success">{routesData.lowHangingFruit.oneAway}</strong> preguntas
                  a 1 átomo de distancia,{" "}
                  <strong className="text-amber-600">{routesData.lowHangingFruit.twoAway}</strong> a 2 átomos
                </p>
              </div>
            )}
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
                  <p className="text-3xl font-bold text-primary">
                    {routesData ? TOTAL_ATOMS - routesData.summary.masteredAtoms : atomsRemaining}
                  </p>
                  <p className="text-sm text-cool-gray mt-1">de {TOTAL_ATOMS} totales</p>
                  {routesData && (
                    <p className="text-sm text-success mt-2">
                      {routesData.summary.unlockedQuestions} de {routesData.summary.totalQuestions} preguntas
                      desbloqueadas
                    </p>
                  )}
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
          <div className={`grid grid-cols-2 gap-4 mb-6 transition-all duration-700 delay-300
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

          {/* Question Review Trigger */}
          {responsesForReview.length > 0 && (
            <div className={`mb-10 transition-all duration-700 delay-500
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <button
                onClick={() => setShowReviewDrawer(true)}
                className="w-full card p-4 flex items-center justify-center gap-3 
                  hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <span className="text-charcoal font-medium">
                  Revisar mis respuestas
                </span>
                <svg
                  className="w-4 h-4 text-cool-gray group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

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

      {/* Question Review Drawer */}
      <QuestionReviewDrawer
        isOpen={showReviewDrawer}
        onClose={() => setShowReviewDrawer(false)}
        responses={responsesForReview}
      />
    </div>
  );
}
