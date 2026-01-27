"use client";

/**
 * Tier-Specific Content Components
 *
 * Provides tier-specific messaging and UI elements based on the performance tier.
 * Follows the conversion optimization spec for appropriate messaging per tier.
 *
 * @see temp-docs/conversion-optimization-implementation.md#performance-tier-system
 */

import React from "react";
import {
  type PerformanceTier,
  type TierConfig,
  TIER_CONFIG,
} from "@/lib/config/tiers";
import { Icons } from "./shared";

// ============================================================================
// TYPES
// ============================================================================

interface TierHeadlineProps {
  tier: PerformanceTier;
  totalCorrect: number;
}

interface TierMessageCardProps {
  tier: PerformanceTier;
  potentialImprovement: number;
  studyHours: number;
  isHighMastery: boolean;
}

interface GenericNextStepProps {
  tier: PerformanceTier;
}

// ============================================================================
// TIER HEADLINES
// ============================================================================

const TIER_HEADLINES: Record<PerformanceTier, string> = {
  perfect: "¡Resultado excepcional!",
  nearPerfect: "¡Excelente resultado!",
  high: "Buen punto de partida",
  average: "Ya tienes una base para construir",
  belowAverage: "Hemos identificado tu punto de partida",
  veryLow: "Gracias por completar el diagnóstico",
};

/**
 * Tier-specific headline shown below the score
 */
export function TierHeadline({ tier }: TierHeadlineProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-1">
      {(tier === "perfect" || tier === "nearPerfect") &&
        Icons.star("w-5 h-5 text-amber-500")}
      {tier === "average" && Icons.trendUp("w-5 h-5 text-success")}
      <p className="text-lg text-charcoal font-medium">
        {TIER_HEADLINES[tier]}
      </p>
    </div>
  );
}

// ============================================================================
// TIER MESSAGE CARDS
// ============================================================================

/**
 * Formats study hours for display in messages.
 * Shows hours for 1+ hours, minutes for less than 1 hour.
 */
function formatStudyTimeForMessage(hours: number): string {
  if (hours >= 1) {
    const rounded = Math.round(hours * 2) / 2;
    if (rounded === 1) return "~1 hora";
    return `~${rounded} horas`;
  }
  const minutes = Math.round(hours * 60);
  return `~${minutes} minutos`;
}

/**
 * Returns the appropriate improvement message based on tier and data.
 * Key value proposition: X points in Y hours.
 */
export function getTierImprovementMessage(
  tier: PerformanceTier,
  potentialImprovement: number,
  studyHours: number,
  isHighMastery: boolean
): React.ReactNode {
  const config = TIER_CONFIG[tier];

  // No projections for certain tiers
  if (config.projectionRule === "none") {
    if (tier === "perfect") {
      return null; // No improvement message for perfect
    }
    if (isHighMastery) {
      return "Ya dominas la gran mayoría del contenido evaluable";
    }
    return null;
  }

  // Conservative projections (near-perfect)
  if (config.projectionRule === "conservative" && potentialImprovement > 0) {
    const timeDisplay = formatStudyTimeForMessage(studyHours);
    return (
      <>
        Hasta{" "}
        <strong className="text-success">+{potentialImprovement} puntos</strong>{" "}
        en <strong className="text-charcoal">{timeDisplay}</strong> de estudio
      </>
    );
  }

  // Moderate/full projections - THE KEY MESSAGE: X points in Y hours
  if (potentialImprovement > 0 && studyHours > 0) {
    const timeDisplay = formatStudyTimeForMessage(studyHours);
    return (
      <>
        Podrías subir{" "}
        <strong className="text-success">+{potentialImprovement} puntos</strong>{" "}
        en <strong className="text-charcoal">{timeDisplay}</strong> de estudio
        enfocado
      </>
    );
  }

  return null;
}

/**
 * Tier-specific message card shown in the results.
 * Shows the key value proposition: X points in Y hours.
 */
export function TierMessageCard({
  tier,
  potentialImprovement,
  studyHours,
  isHighMastery,
}: TierMessageCardProps) {
  const message = getTierImprovementMessage(
    tier,
    potentialImprovement,
    studyHours,
    isHighMastery
  );

  if (!message) return null;

  return (
    <div className="card inline-block px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-amber-200 mb-6">
      <div className="flex items-center justify-center gap-2">
        {Icons.trendUp("w-5 h-5 text-success")}
        <p className="text-charcoal">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// LIMITATION COPY
// ============================================================================

interface LimitationCopyProps {
  tier: PerformanceTier;
  className?: string;
}

/**
 * Shows the limitation copy for tiers where certain modules are absent.
 * Critical for preventing "test is broken" reactions.
 */
export function LimitationCopy({ tier, className = "" }: LimitationCopyProps) {
  const config = TIER_CONFIG[tier];

  // Only show for tiers that need it
  const showForTiers: PerformanceTier[] = [
    "perfect",
    "belowAverage",
    "veryLow",
  ];
  if (!showForTiers.includes(tier)) return null;

  return (
    <div
      className={`flex items-start gap-2 text-sm text-cool-gray ${className}`}
    >
      <svg
        className="w-4 h-4 text-primary mt-0.5 shrink-0"
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
      <span>{config.limitationCopy}</span>
    </div>
  );
}

// ============================================================================
// GENERIC NEXT STEP (for tiers without calculated routes)
// ============================================================================

const GENERIC_NEXT_STEPS: Record<
  "perfect" | "belowAverage" | "veryLow",
  {
    title: string;
    description: string;
  }
> = {
  perfect: {
    title: "Práctica avanzada + Simulacros",
    description:
      "Afinar tu tiempo y estrategia bajo presión con preguntas de dificultad máxima.",
  },
  belowAverage: {
    title: "Fundamentos de Números",
    description:
      "Cuando la plataforma esté lista, continuaremos por estas mini-clases que desbloquean muchas otras.",
  },
  veryLow: {
    title: "Fundamentos",
    description:
      "Cuando la plataforma esté lista, continuaremos por las mini-clases base que desbloquean todo lo demás. Un paso a la vez.",
  },
};

/**
 * Generic next step card for tiers that don't have calculated routes
 */
export function GenericNextStep({ tier }: GenericNextStepProps) {
  const stepData = GENERIC_NEXT_STEPS[tier as keyof typeof GENERIC_NEXT_STEPS];

  if (!stepData) return null;

  return (
    <div className="card p-5 bg-gradient-to-br from-primary/5 to-white border-primary/20 text-center">
      <p className="text-sm text-cool-gray mb-2">
        Tu siguiente paso (cuando lancemos):
      </p>
      <h4 className="font-bold text-charcoal mb-2">{stepData.title}</h4>
      <p className="text-sm text-cool-gray">{stepData.description}</p>
      <p className="text-xs text-primary mt-3">
        Guarda tu progreso para recibir acceso prioritario
      </p>
    </div>
  );
}

// ============================================================================
// SCORE DISPLAY VARIANTS
// ============================================================================

interface ScoreDisplayProps {
  midScore: number;
  scoreMin: number;
  scoreMax: number;
  tier: PerformanceTier;
  showContent: boolean;
}

/**
 * Renders the score with appropriate emphasis based on tier
 */
export function ScoreDisplay({
  midScore,
  scoreMin,
  scoreMax,
  tier,
  showContent,
}: ScoreDisplayProps) {
  const config = TIER_CONFIG[tier];

  // For minimal/secondary emphasis, render smaller at bottom (handled by parent)
  // This component handles primary emphasis
  if (config.scoreEmphasis !== "primary") {
    return null;
  }

  return (
    <div
      className={`transition-all duration-700 
      ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-2">
        Tu Puntaje PAES Estimado
      </h1>
      <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light my-4">
        {midScore}
      </div>
      <div className="text-base text-cool-gray mb-6">
        Rango probable: {scoreMin}–{scoreMax}{" "}
        <span className="text-sm">(≈ ±5 preguntas)</span>
      </div>
    </div>
  );
}

/**
 * Secondary score display for low-signal tiers (shown at bottom)
 */
export function SecondaryScoreDisplay({
  scoreMin,
  scoreMax,
  tier,
}: {
  scoreMin: number;
  scoreMax: number;
  tier: PerformanceTier;
}) {
  const config = TIER_CONFIG[tier];

  if (config.scoreEmphasis === "primary") return null;

  const midScore = Math.round((scoreMin + scoreMax) / 2);
  const textSize = config.scoreEmphasis === "minimal" ? "text-sm" : "text-base";

  return (
    <div className={`text-center ${textSize} text-cool-gray mt-6`}>
      <span className="font-semibold text-charcoal">{midScore}</span> puntos
      estimados{" "}
      <span className="text-xs">
        (rango: {scoreMin}–{scoreMax})
      </span>
    </div>
  );
}

// ============================================================================
// HELPER: Should show routes?
// ============================================================================

export function shouldShowRoutes(tier: PerformanceTier): boolean {
  return TIER_CONFIG[tier].showRoutes;
}

export function getScoreEmphasis(
  tier: PerformanceTier
): TierConfig["scoreEmphasis"] {
  return TIER_CONFIG[tier].scoreEmphasis;
}

// ============================================================================
// CTA BUTTON
// ============================================================================

interface CtaButtonProps {
  onClick: () => void;
  ctaLabel: string;
  className?: string;
  variant?: "primary" | "white";
}

/**
 * Reusable CTA button with consistent styling
 */
export function CtaButton({
  onClick,
  ctaLabel,
  className = "",
  variant = "primary",
}: CtaButtonProps) {
  const baseClasses =
    "inline-flex items-center gap-2 shadow-lg hover:scale-105 transition-transform";
  // Both variants now use larger sizing for better visibility
  const variantClasses =
    variant === "white"
      ? "btn-cta px-10 py-4 text-lg shadow-xl"
      : "btn-cta px-10 py-4 text-lg";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {ctaLabel}
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
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </button>
  );
}

// ============================================================================
// BOTTOM CTA SECTION
// ============================================================================

interface BottomCtaSectionProps {
  onCtaClick: () => void;
  ctaLabel: string;
  expectationLine: string;
  showContent: boolean;
}

/**
 * Bottom CTA banner section with gradient background
 */
export function BottomCtaSection({
  onCtaClick,
  ctaLabel,
  expectationLine,
  showContent,
}: BottomCtaSectionProps) {
  return (
    <div
      className={`mt-10 transition-all duration-700 delay-800
      ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-light p-6 sm:p-8 text-center">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
        <div className="relative">
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
            ¿Listo para mejorar tu puntaje?
          </h3>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Te avisamos cuando la plataforma esté lista para continuar con tu
            ruta personalizada.
          </p>
          <button
            onClick={onCtaClick}
            className="btn-cta px-10 py-4 text-lg shadow-xl inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            {ctaLabel}
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
          <p className="text-white/60 text-xs mt-4 max-w-md mx-auto">
            {expectationLine}
          </p>
        </div>
      </div>
    </div>
  );
}
