"use client";

/**
 * Partial Results Screen
 *
 * Shows the student's score immediately after completing the diagnostic,
 * then explains the trade: answer 4 quick questions about yourself to
 * unlock detailed results (question review + learning routes).
 *
 * Key UX principles:
 * - Instant gratification: Score is shown immediately
 * - Honest trade: Explain what they get (details) for what they give (info)
 * - Clear consequence: Skip link explicitly says "sin ver detalles"
 * - Concrete value prop: "+X puntos en ~Y horas" is highly motivating
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Confetti } from "./Confetti";
import { AnimatedCounter } from "./shared";
import { TierHeadline, CtaButton } from "./TierContent";
import { ImprovementHeroCard } from "./ImprovementHeroCard";
import { type PerformanceTier, getPerformanceTier } from "@/lib/config/tiers";
import {
  trackPartialResultsViewed,
  trackPartialResultsCtaClicked,
} from "@/lib/analytics";

// ============================================================================
// TYPES
// ============================================================================

interface PartialResultsScreenProps {
  /** PAES score range */
  paesMin: number;
  paesMax: number;
  /** Total correct answers (0-16) */
  totalCorrect: number;
  /** Potential points improvement from learning routes (for teaser) */
  potentialImprovement?: number;
  /** Study hours estimate (for teaser) */
  studyHours?: number;
  /** Whether routes are still loading */
  routesLoading?: boolean;
  /** Handler for "Continuar" CTA — goes to profiling */
  onContinue: () => void;
  /** Handler for "Salir sin ver detalles" — goes to confirm-skip */
  onSkip: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CTA_LABEL = "Continuar";

// ============================================================================
// HELPERS
// ============================================================================

/** Checkmark icon reused in teaser bullet list */
function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-success mt-0.5 shrink-0"
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
  );
}

/**
 * Generates animation classes for staggered fade-in effect.
 * Reuses pattern from ResultsScreen.
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

export function PartialResultsScreen({
  paesMin,
  paesMax,
  totalCorrect,
  potentialImprovement = 0,
  studyHours = 0,
  routesLoading = false,
  onContinue,
  onSkip,
}: PartialResultsScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const hasTrackedView = useRef(false);

  // Calculate derived values
  const midScore = Math.round((paesMin + paesMax) / 2);
  const performanceTier: PerformanceTier = getPerformanceTier(totalCorrect);

  // Track partial results view on mount (once)
  useEffect(() => {
    if (!hasTrackedView.current) {
      trackPartialResultsViewed(
        paesMin,
        paesMax,
        performanceTier,
        totalCorrect
      );
      hasTrackedView.current = true;
    }
  }, [paesMin, paesMax, performanceTier, totalCorrect]);

  // Animation timing - staggered fade in
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Determine if we have improvement data
  const hasImprovementData = potentialImprovement > 0 && studyHours > 0;

  /** Handles CTA click: tracks the event then continues to profiling. */
  const handleCtaClick = () => {
    trackPartialResultsCtaClicked(performanceTier, CTA_LABEL);
    onContinue();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Confetti />

      {/* Background - matches ResultsScreen */}
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

        <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
          {/* Completion Badge */}
          <div
            className={`text-center mb-6 ${getAnimationClasses(showContent)}`}
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Diagnóstico Completado
            </div>
          </div>

          {/* Main Score Display */}
          <div
            className={`text-center mb-6 ${getAnimationClasses(showContent, "100")}`}
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2">
              Tu Puntaje PAES Estimado
            </h1>
            <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light my-4">
              <AnimatedCounter target={midScore} duration={2500} delay={400} />
            </div>
            <div className="text-base text-cool-gray mb-2">
              Rango probable: {paesMin}–{paesMax}
            </div>
            <div className="text-sm text-cool-gray">
              {totalCorrect}/16 correctas
            </div>
          </div>

          {/* Tier Headline */}
          <div
            className={`text-center mb-6 ${getAnimationClasses(showContent, "200")}`}
          >
            <TierHeadline tier={performanceTier} totalCorrect={totalCorrect} />
          </div>

          {/* Improvement Hero Card - Key value proposition */}
          {(hasImprovementData || routesLoading) && (
            <div className={`mb-6 ${getAnimationClasses(showContent, "250")}`}>
              <ImprovementHeroCard
                potentialImprovement={potentialImprovement}
                studyHours={studyHours}
                variant="compact"
                isLoading={routesLoading}
              />
            </div>
          )}

          {/* Teaser Card - Unlock detailed results */}
          <div
            className={`card p-6 mb-6 bg-gradient-to-br from-white to-off-white border-gray-200 
              ${getAnimationClasses(showContent, "300")}`}
          >
            <div className="text-center">
              {/* Lock/unlock icon */}
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 mb-4">
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
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-charcoal mb-3">
                Desbloquea tus resultados detallados
              </h3>

              {/* What they unlock - bullet list */}
              <div className="text-left text-sm text-cool-gray space-y-2.5 mb-4">
                <div className="flex items-start gap-2">
                  <CheckIcon />
                  <span>Revisa cada respuesta correcta e incorrecta</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckIcon />
                  <span>Recibe rutas de aprendizaje recomendadas</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckIcon />
                  <span>Recomendaciones basadas en tu situación</span>
                </div>
              </div>

              {/* Explanation of the trade */}
              <p className="text-xs text-cool-gray">
                Responde 4 preguntas rápidas sobre ti para que podamos diseñar
                la mejor estrategia de estudio.
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <div
            className={`text-center ${getAnimationClasses(showContent, "400")}`}
          >
            <CtaButton onClick={handleCtaClick} ctaLabel={CTA_LABEL} />

            {/* Expectation line */}
            <p className="text-xs text-cool-gray mt-3 max-w-sm mx-auto">
              4 preguntas · Menos de 30 segundos
            </p>
          </div>

          {/* De-emphasized skip link — explicit consequence */}
          <div
            className={`text-center mt-8 ${getAnimationClasses(showContent, "500")}`}
          >
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Salir sin ver detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
