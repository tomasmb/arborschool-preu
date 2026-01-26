"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { Confetti } from "./Confetti";
import { Icons, AnimatedCounter } from "./shared";
import {
  useLearningRoutes,
  sortRoutesByImpact,
} from "../hooks/useLearningRoutes";
import {
  QuestionReviewDrawer,
  type ResponseForReview,
} from "./QuestionReviewDrawer";
import { SimpleRouteCard } from "./ResultsComponents";
import { NextConceptsPreview } from "./NextConceptsPreview";
import {
  getPerformanceTier,
  isLowSignalTier,
  getNextConceptsConfig,
} from "@/lib/config";
import { trackResultsViewed, trackResultsCtaClicked } from "@/lib/analytics";
import {
  TierHeadline,
  TierMessageCard,
  LimitationCopy,
  GenericNextStep,
  SecondaryScoreDisplay,
  CtaButton,
  BottomCtaSection,
  shouldShowRoutes,
  getScoreEmphasis,
} from "./TierContent";
import {
  buildNextConceptsFromResponses,
  type ResultsScreenProps,
} from "../utils";

// Re-export types for backward compatibility
export type { AtomResult, TopRouteInfo } from "../utils";

// ============================================================================
// CONSTANTS
// ============================================================================

// Canonical CTA label - single source of truth
const CTA_LABEL = "Guardar mi progreso y recibir acceso";

// Expectation line shown under CTA
const EXPECTATION_LINE =
  "Te avisamos cuando la plataforma esté lista para continuar. 1–2 correos, sin spam. Puedes darte de baja cuando quieras.";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResultsScreen({
  results,
  // route is passed but not currently used - kept for future tier-specific logic
  route: _route,
  totalCorrect,
  atomResults = [],
  responses = [],
  onSignup,
  onScoreCalculated,
  onTopRouteCalculated,
}: ResultsScreenProps) {
  void _route; // Silence unused warning - route may be needed for future tier logic

  const [showContent, setShowContent] = useState(false);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [showMoreRoutes, setShowMoreRoutes] = useState(false);
  const hasTrackedView = useRef(false);

  // Get performance tier and config
  const performanceTier = useMemo(
    () => getPerformanceTier(totalCorrect),
    [totalCorrect]
  );
  const isLowSignal = useMemo(
    () => isLowSignalTier(performanceTier),
    [performanceTier]
  );

  // Prepare responses for review drawer
  const responsesForReview: ResponseForReview[] = useMemo(() => {
    return responses.map((r) => ({
      question: r.question,
      selectedAnswer: r.selectedAnswer,
      isCorrect: r.isCorrect,
    }));
  }, [responses]);

  // Calculate score display
  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const scoreMin = results.paesMin;
  const scoreMax = results.paesMax;
  const scoreEmphasis = getScoreEmphasis(performanceTier);

  // Fetch personalized learning routes based on diagnostic atom results
  const { data: routesData, isLoading: routesLoading } = useLearningRoutes(
    atomResults,
    midScore
  );

  // Notify parent of the diagnostic score for SignupScreen
  useEffect(() => {
    if (onScoreCalculated) {
      onScoreCalculated(midScore);
    }
  }, [midScore, onScoreCalculated]);

  // Sort routes by impact and memoize
  const sortedRoutes = useMemo(() => {
    if (!routesData?.routes) return [];
    return sortRoutesByImpact(routesData.routes);
  }, [routesData?.routes]);

  // Notify parent of the top route for ThankYouScreen
  useEffect(() => {
    if (onTopRouteCalculated && !routesLoading) {
      if (sortedRoutes.length > 0) {
        onTopRouteCalculated({
          name: sortedRoutes[0].axis,
          questionsUnlocked: sortedRoutes[0].questionsUnlocked,
          pointsGain: sortedRoutes[0].pointsGain,
          studyHours: sortedRoutes[0].studyHours,
        });
      } else {
        onTopRouteCalculated(null);
      }
    }
  }, [sortedRoutes, routesLoading, onTopRouteCalculated]);

  // Use the best route's improvement and study hours as the main value proposition
  const { potentialImprovement, studyHours } = useMemo(() => {
    if (sortedRoutes.length > 0) {
      return {
        potentialImprovement: sortedRoutes[0].pointsGain,
        studyHours: sortedRoutes[0].studyHours,
      };
    }
    return { potentialImprovement: 0, studyHours: 0 };
  }, [sortedRoutes]);

  // Check if student has very high mastery
  const isHighMastery = useMemo(() => {
    if (!routesData?.summary) return false;
    const { masteredAtoms, totalAtoms, unlockedQuestions, totalQuestions } =
      routesData.summary;
    return (
      masteredAtoms / totalAtoms > 0.8 ||
      unlockedQuestions / totalQuestions > 0.9
    );
  }, [routesData?.summary]);

  // Build next concepts from wrong answers and recommended route
  const nextConcepts = useMemo(() => {
    const recommendedRoute = sortedRoutes.length > 0 ? sortedRoutes[0] : null;
    return buildNextConceptsFromResponses(responses, recommendedRoute);
  }, [responses, sortedRoutes]);

  // Check if we should show next concepts based on tier
  const nextConceptsConfig = useMemo(
    () => getNextConceptsConfig(performanceTier),
    [performanceTier]
  );
  const showNextConcepts =
    nextConceptsConfig.showPersonalized || nextConceptsConfig.showGenericLadder;

  // Animation timing
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Track results viewed (once on mount)
  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackResultsViewed(
        results.paesMin,
        results.paesMax,
        performanceTier,
        totalCorrect,
        CTA_LABEL
      );
    }
  }, [results.paesMin, results.paesMax, performanceTier, totalCorrect]);

  // Handler for CTA click with analytics tracking
  const handleCtaClick = () => {
    trackResultsCtaClicked(performanceTier, CTA_LABEL);
    onSignup();
  };

  // Should we show calculated routes?
  const showRoutes = shouldShowRoutes(performanceTier);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Confetti />
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div className="fixed top-20 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="fixed bottom-20 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary/10 rounded-full blur-3xl" />

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
          {/* Completion Badge */}
          <div
            className={`text-center mb-6 transition-all duration-700 
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Diagnóstico Completado
            </div>
          </div>

          {/* Limitation Copy (for low-signal tiers - shown first) */}
          {isLowSignal && (
            <div
              className={`mb-6 transition-all duration-700 
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <LimitationCopy
                tier={performanceTier}
                className="justify-center text-center"
              />
            </div>
          )}

          {/* Hero Score (primary emphasis only) */}
          {scoreEmphasis === "primary" && (
            <div
              className={`text-center mb-6 transition-all duration-700 
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-2">
                Tu Puntaje PAES Estimado
              </h1>
              <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light my-4">
                <AnimatedCounter
                  target={midScore}
                  duration={2500}
                  delay={200}
                />
              </div>
              <div className="text-lg text-cool-gray mb-4">
                Rango: {scoreMin} - {scoreMax} puntos
              </div>
            </div>
          )}

          {/* Tier Headline */}
          <div
            className={`text-center mb-6 transition-all duration-700 delay-100
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <TierHeadline tier={performanceTier} totalCorrect={totalCorrect} />
          </div>

          {/* Limitation Copy (for high-signal tiers with missing modules) */}
          {performanceTier === "perfect" && (
            <div
              className={`mb-6 transition-all duration-700 delay-150
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <LimitationCopy
                tier={performanceTier}
                className="justify-center text-center"
              />
            </div>
          )}

          {/* Improvement Message Card */}
          <div
            className={`text-center mb-6 transition-all duration-700 delay-200
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <TierMessageCard
              tier={performanceTier}
              potentialImprovement={potentialImprovement}
              studyHours={studyHours}
              isHighMastery={isHighMastery}
            />
          </div>

          {/* Learning Route OR Generic Next Step */}
          <div
            className={`mb-6 transition-all duration-700 delay-300
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {showRoutes ? (
              <>
                <p className="text-sm text-cool-gray mb-3">
                  Tu ruta de mayor impacto:
                </p>
                {routesLoading ? (
                  <div className="card p-6 flex justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : sortedRoutes.length > 0 ? (
                  <SimpleRouteCard
                    route={sortedRoutes[0]}
                    isRecommended={true}
                  />
                ) : null}
              </>
            ) : (
              <GenericNextStep tier={performanceTier} />
            )}
          </div>

          {/* Low Hanging Fruit (only for tiers with routes) */}
          {showRoutes &&
            routesData?.lowHangingFruit &&
            routesData.lowHangingFruit.oneAway > 0 && (
              <div
                className={`mb-6 transition-all duration-700 delay-400
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="flex items-center gap-2 text-sm text-cool-gray">
                  {Icons.lightbulb("w-4 h-4 text-success")}
                  <span>
                    Tienes{" "}
                    <strong className="text-success">
                      {routesData.lowHangingFruit.oneAway}
                    </strong>{" "}
                    preguntas a 1 sola mini-clase de distancia.
                  </span>
                </div>
              </div>
            )}

          {/* Primary CTA */}
          <div
            className={`text-center mb-8 transition-all duration-700 delay-500
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <CtaButton onClick={handleCtaClick} ctaLabel={CTA_LABEL} />
            <p className="text-xs text-cool-gray mt-3 max-w-md mx-auto">
              {EXPECTATION_LINE}
            </p>
          </div>

          {/* "Ver más rutas" toggle (only for tiers with routes) */}
          {showRoutes && sortedRoutes.length > 1 && (
            <div
              className={`text-center mb-6 transition-all duration-700 delay-600
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <button
                onClick={() => setShowMoreRoutes(!showMoreRoutes)}
                className="text-cool-gray text-sm flex items-center gap-1 mx-auto hover:text-charcoal transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showMoreRoutes ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {showMoreRoutes
                  ? "Ver menos rutas"
                  : "Ver más rutas de aprendizaje"}
              </button>
            </div>
          )}

          {/* Next Concepts Preview (expanded) */}
          {showMoreRoutes && showNextConcepts && (
            <div className="mb-6 animate-fadeIn">
              <NextConceptsPreview
                tier={performanceTier}
                concepts={nextConcepts}
              />
            </div>
          )}

          {/* Additional Routes (expanded) */}
          {showMoreRoutes && sortedRoutes.length > 1 && (
            <div className="mb-8 space-y-3 animate-fadeIn">
              <p className="text-sm text-cool-gray mb-3">
                Otras rutas de aprendizaje:
              </p>
              {sortedRoutes.slice(1, 4).map((route) => (
                <SimpleRouteCard
                  key={route.axis}
                  route={route}
                  isRecommended={false}
                />
              ))}
            </div>
          )}

          {/* Stats Summary */}
          <div
            className={`flex items-center justify-center gap-4 text-sm text-cool-gray mb-6 transition-all duration-700 delay-600
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span>Tu desempeño: {totalCorrect}/16 correctas</span>
          </div>

          {/* Question Review Link */}
          {responsesForReview.length > 0 && (
            <div
              className={`text-center mb-6 transition-all duration-700 delay-700
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <button
                onClick={() => setShowReviewDrawer(true)}
                className="text-cool-gray text-sm hover:text-charcoal transition-colors inline-flex items-center gap-1"
              >
                Revisar mis respuestas
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Secondary Score Display (for low-signal tiers) */}
          {scoreEmphasis !== "primary" && (
            <div
              className={`transition-all duration-700 delay-700
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <SecondaryScoreDisplay
                scoreMin={scoreMin}
                scoreMax={scoreMax}
                tier={performanceTier}
              />
            </div>
          )}

          {/* Bottom CTA Section */}
          <BottomCtaSection
            onCtaClick={handleCtaClick}
            ctaLabel={CTA_LABEL}
            expectationLine={EXPECTATION_LINE}
            showContent={showContent}
          />
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
