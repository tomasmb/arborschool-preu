"use client";

/**
 * Next Concepts Preview Component
 *
 * Displays a tier-gated micro-preview of concepts to learn next.
 * Derived ONLY from wrong answers (direct evidence).
 *
 * @see temp-docs/results-next-concepts-spec.md
 */

import React, { useState } from "react";
import {
  type PerformanceTier,
  type NextConcept,
  getNextConceptsConfig,
  GENERIC_FOUNDATIONS_LADDER,
} from "@/lib/config";

// ============================================================================
// TYPES
// ============================================================================

interface NextConceptsPreviewProps {
  /** Performance tier from diagnostic */
  tier: PerformanceTier;
  /** List of next concepts (from wrong answers only) */
  concepts: NextConcept[];
  /** Optional: additional class names */
  className?: string;
}

// ============================================================================
// ICONS (local to avoid bloating shared.tsx)
// ============================================================================

function ChevronIcon({
  className,
  rotated,
}: {
  className?: string;
  rotated?: boolean;
}) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${rotated ? "rotate-180" : ""}`}
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
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// ============================================================================
// PERSONALIZED CONCEPTS LIST
// ============================================================================

interface PersonalizedConceptsProps {
  concepts: NextConcept[];
  maxDefault: number;
  maxExpanded: number;
}

function PersonalizedConceptsList({
  concepts,
  maxDefault,
  maxExpanded,
}: PersonalizedConceptsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Nothing to show
  if (concepts.length === 0) return null;

  // Items to display based on expansion state
  const displayCount = isExpanded ? maxExpanded : maxDefault;
  const displayedConcepts = concepts.slice(0, displayCount);
  const hasMore = concepts.length > maxDefault && maxExpanded > maxDefault;

  return (
    <div className="space-y-3">
      {/* Title with scoping language */}
      <div>
        <h4 className="text-sm font-semibold text-charcoal">
          Tus próximas mini-clases{" "}
          <span className="font-normal text-cool-gray">
            (según este diagnóstico)
          </span>
        </h4>
        <p className="text-xs text-cool-gray mt-0.5">
          Detectadas a partir de tus respuestas incorrectas.
        </p>
      </div>

      {/* Concept chips */}
      <ol className="space-y-2">
        {displayedConcepts.map((concept, index) => (
          <li key={concept.atomId} className="flex items-start gap-2">
            {/* Number badge */}
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary 
                text-xs font-medium flex items-center justify-center mt-0.5"
            >
              {index + 1}
            </span>

            <div className="flex-1 min-w-0">
              {/* Concept title */}
              <p className="text-sm text-charcoal leading-tight">
                {concept.title}
              </p>

              {/* Evidence tag (optional) */}
              {concept.unlocksQuestionsCount &&
              concept.unlocksQuestionsCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-cool-gray mt-0.5">
                  <svg
                    className="w-3 h-3"
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
                  Desbloquea {concept.unlocksQuestionsCount} preguntas PAES
                </span>
              ) : (
                <span className="text-xs text-cool-gray mt-0.5">
                  Detectada en una respuesta incorrecta
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Expand/collapse toggle */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-cool-gray hover:text-charcoal transition-colors"
        >
          <ChevronIcon className="w-3.5 h-3.5" rotated={isExpanded} />
          {isExpanded
            ? "Ver menos"
            : `Ver más mini-clases (${Math.min(concepts.length, maxExpanded)} total)`}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// GENERIC FOUNDATIONS LADDER
// ============================================================================

interface GenericFoundationsLadderProps {
  className?: string;
}

function GenericFoundationsLadder({
  className = "",
}: GenericFoundationsLadderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Title */}
      <div>
        <h4 className="text-sm font-semibold text-charcoal">
          Tu siguiente paso{" "}
          <span className="font-normal text-cool-gray">(cuando lancemos)</span>
        </h4>
      </div>

      {/* Ladder steps */}
      <ol className="space-y-2">
        {GENERIC_FOUNDATIONS_LADDER.map((step) => (
          <li key={step.step} className="flex items-start gap-2">
            {/* Step number */}
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary 
                text-xs font-medium flex items-center justify-center mt-0.5"
            >
              {step.step}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-charcoal leading-tight">
                {step.title}
              </p>
              <p className="text-xs text-cool-gray mt-0.5">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Support line */}
      <p className="text-xs text-cool-gray italic">
        Un paso a la vez. El progreso se acelera cuando los fundamentos están
        sólidos.
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Renders the appropriate next concepts preview based on tier.
 * - Personalized concepts for nearPerfect, high, average tiers
 * - Generic foundations ladder for belowAverage, veryLow tiers
 * - Nothing for perfect tier
 */
export function NextConceptsPreview({
  tier,
  concepts,
  className = "",
}: NextConceptsPreviewProps) {
  const config = getNextConceptsConfig(tier);

  // Perfect tier: no preview
  if (!config.showPersonalized && !config.showGenericLadder) {
    return null;
  }

  // Low-signal tiers: generic ladder
  if (config.showGenericLadder) {
    return (
      <div
        className={`border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-gray-50/50 to-white ${className}`}
      >
        <GenericFoundationsLadder />
      </div>
    );
  }

  // Personalized preview for high-signal tiers
  if (config.showPersonalized && concepts.length > 0) {
    return (
      <div
        className={`border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-gray-50/50 to-white ${className}`}
      >
        <PersonalizedConceptsList
          concepts={concepts}
          maxDefault={config.maxDefault}
          maxExpanded={config.maxExpanded}
        />
      </div>
    );
  }

  // No concepts to show (fallback)
  return null;
}

// ============================================================================
// EXPORTS FOR EXAMPLE MODAL
// ============================================================================

export { GenericFoundationsLadder };
