"use client";

import React from "react";
import { AXIS_NAMES, type Axis } from "@/lib/diagnostic/config";
import { Icons, AXIS_ICONS } from "./shared";
import type { LearningRouteData } from "../hooks/useLearningRoutes";

// ============================================================================
// TYPES
// ============================================================================

export interface AxisPerformance {
  correct: number;
  total: number;
  percentage: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets a motivational message based on axis performance.
 * Used for tiers with enough signal to identify a strongest axis.
 */
export function getMotivationalMessage(
  axisPerformance: Record<Axis, AxisPerformance>
): { axis: Axis; axisName: string; percentage: number; message: string } {
  const sorted = Object.entries(axisPerformance).sort(
    (a, b) => b[1].percentage - a[1].percentage
  );
  const [strongestAxis, data] = sorted[0];
  const axis = strongestAxis as Axis;
  const percentage = data.percentage;

  const messages: Record<Axis, string> = {
    ALG: `El Álgebra es lo tuyo. Tienes una base sólida.`,
    NUM: `Destacas en Números — es tu fortaleza matemática.`,
    GEO: `Tienes ojo para la Geometría — ves las formas.`,
    PROB: `Eres fuerte en Probabilidad — datos y azar son lo tuyo.`,
  };

  return {
    axis,
    axisName: AXIS_NAMES[axis],
    percentage,
    message: messages[axis],
  };
}

// ============================================================================
// SIMPLE ROUTE CARD (Simplified for Phase 2)
// ============================================================================

interface SimpleRouteCardProps {
  route: LearningRouteData;
  isRecommended: boolean;
}

/**
 * Formats study hours for display.
 * Shows hours for 1+ hours, minutes for less than 1 hour.
 */
function formatStudyTime(hours: number): string {
  if (hours >= 1) {
    // Round to nearest half hour for cleaner display
    const rounded = Math.round(hours * 2) / 2;
    if (rounded === 1) return "~1 hora";
    return `~${rounded} horas`;
  }
  // Less than 1 hour - show minutes
  const minutes = Math.round(hours * 60);
  return `~${minutes} min`;
}

/**
 * Simplified route card showing questions unlocked, points gain, and study time.
 * The key value proposition: X points in Y hours.
 */
export function SimpleRouteCard({
  route,
  isRecommended,
}: SimpleRouteCardProps) {
  const axisKey = route.axis as Axis;
  const AxisIcon = AXIS_ICONS[axisKey] || Icons.book;
  const studyTimeDisplay = formatStudyTime(route.studyHours);

  return (
    <div
      className={`card p-5 ${isRecommended ? "ring-2 ring-accent ring-offset-2 bg-gradient-to-br from-accent/5 to-white" : ""}`}
    >
      {isRecommended && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-3">
          {Icons.target("w-3.5 h-3.5")}
          RECOMENDADO
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {AxisIcon("w-5 h-5 text-primary")}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-charcoal">{route.title}</h4>

          {/* Key value proposition: points + time */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-success font-bold text-lg">
              +{route.pointsGain} puntos
            </span>
            <span className="text-cool-gray">en</span>
            <span className="text-charcoal font-semibold">
              {studyTimeDisplay}
            </span>
          </div>

          {/* Secondary info: questions unlocked */}
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-cool-gray">
            {Icons.unlock("w-4 h-4")}
            <span>+{route.questionsUnlocked} preguntas PAES</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEGACY EXPORTS (for backwards compatibility during migration)
// ============================================================================

/** @deprecated Use SimpleRouteCard instead */
export { SimpleRouteCard as RouteCard };

/** @deprecated Atom mastery data from API - only kept for type compatibility */
export interface ActualAxisMastery {
  axis: string;
  totalAtoms: number;
  masteredAtoms: number;
  masteryPercentage: number;
}
