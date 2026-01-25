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
 * Simplified route card showing only questions unlocked and points gain.
 * Removes atom counts and study time estimates per the conversion optimization spec.
 */
export function SimpleRouteCard({
  route,
  isRecommended,
}: SimpleRouteCardProps) {
  const axisKey = route.axis as Axis;
  const AxisIcon = AXIS_ICONS[axisKey] || Icons.book;

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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
            <div className="flex items-center gap-1.5">
              {Icons.unlock("w-4 h-4 text-primary")}
              <span className="text-charcoal">
                +{route.questionsUnlocked} preguntas PAES
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {Icons.trendUp("w-4 h-4 text-success")}
              <span className="text-success font-semibold">
                +{route.pointsGain} puntos
              </span>
            </div>
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
