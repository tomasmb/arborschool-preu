"use client";

/**
 * Plan Preview Screen — Phase 2 of the new onboarding flow.
 *
 * Shown AFTER the diagnostic results screen when NEXT_PUBLIC_NEW_ONBOARDING=true.
 * Purpose: Show the student a concrete projection to their career goal,
 * and preview the first atoms to study to activate the next session.
 *
 * V1: Static projection (no slider). Simplified calculation.
 * TODO(v2): Add interactive slider with real atom-wave projection model
 *           per diagnostic-score-methodology.md Section 6 and arbor-ux-design-v1.md Section 3.
 */

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCareerGoal } from "./careers";
import { type LearningRoutesResponse } from "@/app/diagnostico/hooks/useLearningRoutes";

// ============================================================================
// TYPES
// ============================================================================

interface PlanPreviewScreenProps {
  diagnosticScore: number;
  routesData: LearningRoutesResponse | null;
  /** Diagnostic attempt ID — used to link back to the results page. */
  sessionId?: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ATOMS_PER_WEEK_DEFAULT = 3;
const AVG_PTS_PER_ATOM = 5;
const PAES_SCALE_MIN = 100;
const PAES_SCALE_MAX = 1000;

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

function calcWeeksToGoal(gap: number): number {
  if (gap <= 0) return 0;
  return Math.max(
    1,
    Math.round(gap / (ATOMS_PER_WEEK_DEFAULT * AVG_PTS_PER_ATOM))
  );
}

function calcProgressPercent(score: number): number {
  const range = PAES_SCALE_MAX - PAES_SCALE_MIN;
  return Math.min(100, Math.max(0, ((score - PAES_SCALE_MIN) / range) * 100));
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ProjectionBarProps {
  diagnosticScore: number;
  targetScore: number;
}

function ProjectionBar({ diagnosticScore, targetScore }: ProjectionBarProps) {
  const currentPct = calcProgressPercent(diagnosticScore);
  const targetPct = calcProgressPercent(targetScore);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-cool-gray">
        <span>100</span>
        <span>1000</span>
      </div>

      {/* Scale bar */}
      <div className="relative h-8 bg-light-bg rounded-full overflow-visible">
        {/* Filled progress to current score */}
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700"
          style={{ width: `${currentPct}%` }}
        />

        {/* Target marker — gold vertical line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-accent"
          style={{ left: `${targetPct}%` }}
        />

        {/* Current score label */}
        <div
          className="absolute -top-6 text-xs font-bold text-primary whitespace-nowrap"
          style={{
            left: `${currentPct}%`,
            transform: "translateX(-50%)",
          }}
        >
          Hoy: {diagnosticScore}
        </div>

        {/* Target label */}
        <div
          className="absolute -bottom-6 text-xs font-bold text-accent whitespace-nowrap"
          style={{
            left: `${targetPct}%`,
            transform: "translateX(-50%)",
          }}
        >
          Meta: {Math.round(targetScore)}
        </div>
      </div>

      {/* Spacer for bottom labels */}
      <div className="h-4" />
    </div>
  );
}

interface AtomPreviewItemProps {
  title: string;
  index: number;
  questionsUnlocked: number;
}

function AtomPreviewItem({
  title,
  index,
  questionsUnlocked,
}: AtomPreviewItemProps) {
  const isFirst = index === 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
        ${
          isFirst
            ? "border-primary/30 bg-primary/5"
            : "border-gray-200 bg-white"
        }`}
    >
      {/* Atom number indicator */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
          ${isFirst ? "bg-primary text-white" : "bg-light-bg text-cool-gray"}`}
      >
        {index + 1}
      </div>

      {/* Atom info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isFirst ? "text-primary" : "text-charcoal"}`}
        >
          {title}
        </p>
        <p className="text-xs text-cool-gray">
          +{questionsUnlocked}{" "}
          {questionsUnlocked === 1 ? "pregunta" : "preguntas"} PAES al dominar
        </p>
      </div>

      {/* Status */}
      {isFirst && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
          Primero
        </span>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlanPreviewScreen({
  diagnosticScore,
  routesData,
  sessionId,
}: PlanPreviewScreenProps) {
  const careerGoal = useMemo(() => {
    // Only read localStorage on client
    if (typeof window === "undefined") return null;
    return getCareerGoal();
  }, []);

  const { gap, weeksToGoal, targetScore, hasGoal } = useMemo(() => {
    if (!careerGoal) {
      return { gap: 0, weeksToGoal: 0, targetScore: 0, hasGoal: false };
    }
    const target = careerGoal.puntaje_corte;
    const g = Math.max(0, target - diagnosticScore);
    return {
      gap: g,
      weeksToGoal: calcWeeksToGoal(g),
      targetScore: target,
      hasGoal: true,
    };
  }, [careerGoal, diagnosticScore]);

  // Extract first 3 atoms from best route
  const previewAtoms = useMemo(() => {
    if (!routesData?.routes?.length) return [];
    const bestRoute = routesData.routes[0];
    return (bestRoute.atoms ?? []).slice(0, 3).map((a) => ({
      id: a.id,
      title: a.title,
      questionsUnlocked: a.questionsUnlocked,
    }));
  }, [routesData]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div
        className="fixed top-20 left-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-20 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
            <Image src="/logo-arbor.svg" alt="Arbor" width={32} height={32} />
            <span className="text-lg font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        </header>

        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
          {/* Headline */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full mb-4">
              <span className="w-2 h-2 bg-success rounded-full" />
              Tu ruta está lista
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
              {hasGoal && careerGoal
                ? `Tu camino a ${careerGoal.nombre}`
                : "Tu plan personalizado"}
            </h1>
            {hasGoal && careerGoal && (
              <p className="text-sm text-cool-gray mt-1">
                {careerGoal.universidad} · Meta: {Math.round(targetScore)} pts
              </p>
            )}
          </div>

          {/* Projection graph card */}
          {hasGoal && targetScore > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-charcoal mb-4">
                Proyección de puntaje
              </h2>
              <ProjectionBar
                diagnosticScore={diagnosticScore}
                targetScore={targetScore}
              />

              {/* Projection summary */}
              <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <p className="text-sm text-charcoal">
                  Estudiando{" "}
                  <span className="font-bold">
                    {ATOMS_PER_WEEK_DEFAULT} átomos/semana
                  </span>
                  , llegas a tu meta en{" "}
                  <span className="font-bold text-accent">
                    ~{weeksToGoal} semanas
                  </span>
                </p>
                <p className="text-xs text-cool-gray mt-1">
                  ~15 min por átomo · 5 pts estimados por átomo dominado
                </p>
                <p className="text-xs text-light-gray mt-1">
                  Proyección V1 simplificada — basada en el modelo Arbor.
                  {/* TODO(v2): use real atom-wave projection per arbor-ux-design-v1.md §3.2 */}
                </p>
              </div>
            </div>
          )}

          {/* Score baseline card (shown always) */}
          {!hasGoal && (
            <div className="card p-6 text-center">
              <p className="text-sm text-cool-gray mb-1">
                Tu puntaje diagnóstico estimado
              </p>
              <p className="text-4xl font-bold text-primary">
                {diagnosticScore}
              </p>
              <p className="text-xs text-cool-gray mt-1">
                Escala 100-1000 PAES M1
              </p>
            </div>
          )}

          {/* Recommended atoms card */}
          {previewAtoms.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-charcoal mb-3">
                Los primeros átomos para estudiar
              </h2>
              <div className="space-y-2">
                {previewAtoms.map((atom, i) => (
                  <AtomPreviewItem
                    key={atom.id}
                    title={atom.title}
                    index={i}
                    questionsUnlocked={atom.questionsUnlocked}
                  />
                ))}
              </div>
              <p className="text-xs text-cool-gray mt-3 text-center">
                Cada átomo desbloquea preguntas reales del PAES
              </p>
            </div>
          )}

          {/* Fallback when no atoms */}
          {previewAtoms.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-sm text-cool-gray">
                Tu ruta de estudio está siendo calculada.
                <br />
                Estará disponible al iniciar sesión.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="pb-8">
            <Link
              href={sessionId ? `/resultados/${sessionId}` : "/diagnostico"}
              className="btn-cta w-full flex justify-center py-4 text-lg shadow-lg 
                hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              Ver mi diagnóstico
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <p className="text-xs text-cool-gray text-center mt-3">
              Aquí están tus resultados detallados y los primeros átomos
              recomendados para empezar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
