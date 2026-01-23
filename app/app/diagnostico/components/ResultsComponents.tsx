"use client";

import React, { useEffect, useState } from "react";
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
// CONSTANTS
// ============================================================================

export const ATOM_COUNTS: Record<Axis, number> = { ALG: 80, NUM: 55, GEO: 43, PROB: 51 };
export const TOTAL_ATOMS = 229;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
    ALG: `El Algebra es lo tuyo. Con ${percentage}% de dominio, tienes una base solida.`,
    NUM: `Destacas en Numeros. Dominas el ${percentage}% — es tu fortaleza matematica.`,
    GEO: `Tienes ojo para la Geometria. ${percentage}% de dominio — ves las formas.`,
    PROB: `Eres fuerte en Probabilidad. ${percentage}% de dominio en datos y azar.`,
  };

  return { axis, axisName: AXIS_NAMES[axis], percentage, message: messages[axis] };
}

export function calculateAtomsDominated(percentage: number, totalAtoms: number): number {
  return Math.round((percentage / 100) * totalAtoms);
}

export function calculateTotalAtomsRemaining(axisPerformance: Record<Axis, AxisPerformance>): number {
  let totalDominated = 0;
  for (const axis of Object.keys(axisPerformance) as Axis[]) {
    totalDominated += calculateAtomsDominated(axisPerformance[axis].percentage, ATOM_COUNTS[axis]);
  }
  return TOTAL_ATOMS - totalDominated;
}

export function getWeeksByStudyTime(atomsRemaining: number) {
  const totalMinutes = atomsRemaining * 20;
  return {
    thirtyMin: Math.ceil(totalMinutes / 30 / 7),
    fortyFiveMin: Math.ceil(totalMinutes / 45 / 7),
    sixtyMin: Math.ceil(totalMinutes / 60 / 7),
  };
}

// ============================================================================
// AXIS PROGRESS BAR
// ============================================================================

interface AxisProgressBarProps {
  axis: Axis;
  data: AxisPerformance;
  isStrength: boolean;
  isOpportunity: boolean;
  delay: number;
}

export function AxisProgressBar({ axis, data, isStrength, isOpportunity, delay }: AxisProgressBarProps) {
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
        <span className="text-sm text-cool-gray">{atomsDominated}/{ATOM_COUNTS[axis]} atomos</span>
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

// ============================================================================
// ROUTE CARD
// ============================================================================

interface RouteCardProps {
  route: LearningRouteData;
  isRecommended: boolean;
  delay: number;
}

export function RouteCard({ route, isRecommended, delay }: RouteCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const axisKey = route.axis as Axis;
  const AxisIcon = AXIS_ICONS[axisKey] || Icons.book;

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
            <h4 className="font-bold text-charcoal text-lg">{route.title}</h4>
            <p className="text-sm text-cool-gray mb-4">{route.subtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                {Icons.book("w-4 h-4 text-primary")}
                <span className="text-charcoal">{route.atomCount} atomos</span>
              </div>
              <div className="flex items-center gap-2">
                {Icons.unlock("w-4 h-4 text-primary")}
                <span className="text-charcoal">+{route.questionsUnlocked} preguntas</span>
              </div>
              <div className="flex items-center gap-2">
                {Icons.trendUp("w-4 h-4 text-success")}
                <span className="text-success font-semibold">+{route.pointsGain} pts PAES</span>
              </div>
              <div className="flex items-center gap-2">
                {Icons.clock("w-4 h-4 text-cool-gray")}
                <span className="text-cool-gray">~{route.studyHours} hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
