"use client";

/**
 * Full Results Screen
 *
 * Shows complete diagnostic results including learning routes, question review,
 * and personalized recommendations. This is the endpoint for signed-up users.
 *
 * When hasSignedUp=true (user came from signup flow):
 * - Shows success banner confirming signup
 * - Hides signup CTA (already done)
 * - Shows "Volver al Inicio" link at bottom
 */

import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { trackResultsViewed, trackRouteExplored } from "@/lib/analytics";
import {
  TierHeadline,
  TierMessageCard,
  LimitationCopy,
  GenericNextStep,
  SecondaryScoreDisplay,
  CtaButton,
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
const CTA_LABEL = "Guardar y recibir acceso";

// Expectation line shown under CTA
const EXPECTATION_LINE =
  "Te avisamos cuando la plataforma esté lista para continuar. 1–2 correos, sin spam. Puedes darte de baja cuando quieras.";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generates animation classes for staggered fade-in effect.
 * @param showContent - Whether content should be visible
 * @param delay - Tailwind delay class (e.g., "100", "200", "300")
 */
function getAnimationClasses(showContent: boolean, delay?: string): string {
  const delayClass = delay ? `delay-${delay}` : "";
  const visibilityClass = showContent
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-8";
  return `transition-all duration-700 ${delayClass} ${visibilityClass}`.trim();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResultsScreen({
  results,
  route,
  totalCorrect,
  atomResults = [],
  responses = [],
  onSignup,
  onScoreCalculated,
  onTopRouteCalculated,
  precomputedRoutes,
  precomputedNextConcepts,
  hasSignedUp = false,
}: ResultsScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
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
  // Skip API call entirely if precomputed routes are provided (example mode)
  const liveRoutes = useLearningRoutes(atomResults, midScore, {
    skip: !!precomputedRoutes,
  });
  const routesData = precomputedRoutes ?? liveRoutes.data;
  const routesLoading = precomputedRoutes ? false : liveRoutes.isLoading;

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
  // Use precomputed data if provided (example mode)
  const nextConcepts = useMemo(() => {
    if (precomputedNextConcepts) {
      return precomputedNextConcepts;
    }
    const recommendedRoute = sortedRoutes.length > 0 ? sortedRoutes[0] : null;
    return buildNextConceptsFromResponses(responses, recommendedRoute);
  }, [responses, sortedRoutes, precomputedNextConcepts]);

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
        route,
        CTA_LABEL
      );
    }
  }, [results.paesMin, results.paesMax, performanceTier, totalCorrect, route]);

  // Handler for CTA click (only used in ExampleResultsModal preview)
  const handleCtaClick = () => {
    onSignup?.();
  };

  // Handler for route exploration toggle with analytics tracking
  const handleRouteToggle = () => {
    // Only track when expanding, not collapsing
    if (!showMoreDetails) {
      trackRouteExplored(performanceTier, route);
    }
    setShowMoreDetails(!showMoreDetails);
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
            className={`text-center mb-6 ${getAnimationClasses(showContent)}`}
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Diagnóstico Completado
            </div>
          </div>

          {/* Success Banner - shown when user signed up */}
          {hasSignedUp && (
            <div className={`mb-6 ${getAnimationClasses(showContent)}`}>
              <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-xl">
                <svg
                  className="w-5 h-5 text-success shrink-0"
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
                <span className="text-success font-medium">
                  Tu diagnóstico está guardado. Te avisamos cuando lancemos.
                </span>
              </div>
            </div>
          )}

          {/* Limitation Copy (for low-signal tiers - shown first) */}
          {isLowSignal && (
            <div className={`mb-6 ${getAnimationClasses(showContent)}`}>
              <LimitationCopy
                tier={performanceTier}
                className="justify-center text-center"
              />
            </div>
          )}

          {/* Hero Score (primary emphasis only) */}
          {scoreEmphasis === "primary" && (
            <div
              className={`text-center mb-6 ${getAnimationClasses(showContent)}`}
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
              <div className="text-base text-cool-gray mb-2">
                Rango probable: {scoreMin}–{scoreMax}{" "}
                <span className="text-sm">(≈ ±5 preguntas)</span>
              </div>
              <div className="text-sm text-cool-gray">
                {totalCorrect}/16 correctas
              </div>
            </div>
          )}

          {/* Question Review Link (early - users want to know WHY) */}
          {responsesForReview.length > 0 && (
            <div
              className={`text-center mb-6 ${getAnimationClasses(showContent, "100")}`}
            >
              <button
                onClick={() => setShowReviewDrawer(true)}
                className="text-primary text-sm hover:text-primary-light transition-colors inline-flex items-center gap-1.5 font-medium"
              >
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Revisar mis respuestas
              </button>
            </div>
          )}

          {/* Tier Headline */}
          <div
            className={`text-center mb-6 ${getAnimationClasses(showContent, "150")}`}
          >
            <TierHeadline tier={performanceTier} totalCorrect={totalCorrect} />
          </div>

          {/* Limitation Copy (for high-signal tiers with missing modules) */}
          {performanceTier === "perfect" && (
            <div className={`mb-6 ${getAnimationClasses(showContent, "200")}`}>
              <LimitationCopy
                tier={performanceTier}
                className="justify-center text-center"
              />
            </div>
          )}

          {/* Improvement Message Card */}
          <div
            className={`text-center mb-6 ${getAnimationClasses(showContent, "250")}`}
          >
            <TierMessageCard
              tier={performanceTier}
              potentialImprovement={potentialImprovement}
              studyHours={studyHours}
              isHighMastery={isHighMastery}
            />
          </div>

          {/* Primary CTA (early - right after value proposition) - hidden if already signed up */}
          {!hasSignedUp && (
            <div
              className={`text-center mb-6 ${getAnimationClasses(showContent, "300")}`}
            >
              <CtaButton onClick={handleCtaClick} ctaLabel={CTA_LABEL} />
              <p className="text-xs text-cool-gray mt-3 max-w-md mx-auto">
                {EXPECTATION_LINE}
              </p>
            </div>
          )}

          {/* Generic Next Step (for tiers without calculated routes) */}
          {!showRoutes && (
            <div className={`mb-6 ${getAnimationClasses(showContent, "350")}`}>
              <GenericNextStep tier={performanceTier} />
            </div>
          )}

          {/* "Explorar mi ruta" toggle - contains all route details */}
          {showRoutes && (
            <div
              className={`text-center mb-6 ${getAnimationClasses(showContent, "350")}`}
            >
              <button
                onClick={handleRouteToggle}
                className="text-primary text-sm font-medium flex items-center gap-1.5 mx-auto hover:text-primary-light transition-colors"
                aria-expanded={showMoreDetails}
              >
                {showMoreDetails ? (
                  <>
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
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    Ocultar detalles
                  </>
                ) : (
                  <>
                    Explorar mi ruta personalizada
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Expanded content - all route details inside toggle */}
              {showMoreDetails && (
                <div className="mt-6 space-y-6 animate-fadeIn text-left">
                  {/* Recommended Route Card */}
                  <div>
                    <p className="text-sm text-cool-gray mb-3 text-center">
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
                  </div>

                  {/* Low Hanging Fruit */}
                  {routesData?.lowHangingFruit &&
                    routesData.lowHangingFruit.oneAway > 0 && (
                      <div className="flex items-center justify-center gap-2 text-sm text-cool-gray">
                        {Icons.lightbulb("w-4 h-4 text-success")}
                        <span>
                          Tienes{" "}
                          <strong className="text-success">
                            {routesData.lowHangingFruit.oneAway}
                          </strong>{" "}
                          preguntas a 1 sola mini-clase de distancia.
                        </span>
                      </div>
                    )}

                  {/* Next Mini-Clases (from recommended route) */}
                  {showNextConcepts && nextConcepts.length > 0 && (
                    <NextConceptsPreview
                      tier={performanceTier}
                      concepts={nextConcepts}
                    />
                  )}

                  {/* Other Routes */}
                  {sortedRoutes.length > 1 && (
                    <div>
                      <p className="text-sm text-cool-gray mb-3 text-center">
                        Otras rutas disponibles
                      </p>
                      <div className="space-y-3">
                        {sortedRoutes.slice(1, 4).map((route) => (
                          <SimpleRouteCard
                            key={route.axis}
                            route={route}
                            isRecommended={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secondary CTA inside toggle for engaged readers - hidden if already signed up */}
                  {!hasSignedUp && (
                    <div className="text-center pt-4 border-t border-gray-100">
                      <p className="text-sm text-cool-gray mb-3">
                        ¿Listo para comenzar tu ruta?
                      </p>
                      <button
                        onClick={handleCtaClick}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors"
                      >
                        Continuar
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
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Secondary Score Display (for low-signal tiers) */}
          {scoreEmphasis !== "primary" && (
            <div className={getAnimationClasses(showContent, "400")}>
              <SecondaryScoreDisplay
                scoreMin={scoreMin}
                scoreMax={scoreMax}
                tier={performanceTier}
              />
            </div>
          )}

          {/* Home Link - shown when user signed up (this is the endpoint) */}
          {hasSignedUp && (
            <div
              className={`text-center mt-10 pb-8 ${getAnimationClasses(showContent, "500")}`}
            >
              <Link
                href="/"
                className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                Volver al Inicio
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </Link>
              <p className="text-sm text-cool-gray mt-4">
                Esta experiencia fue solo el comienzo
              </p>
            </div>
          )}
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
