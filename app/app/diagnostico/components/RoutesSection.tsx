"use client";

/**
 * Learning routes display section for ResultsScreen.
 *
 * For signed-up users: routes are shown directly.
 * For preview mode (not signed up): routes are behind a toggle.
 */

import React from "react";
import { Icons } from "./diagnosticIcons";
import { SimpleRouteCard } from "./ResultsComponents";
import { NextConceptsPreview } from "./NextConceptsPreview";
import type { LearningRouteData } from "../hooks/useLearningRoutes";
import type { PerformanceTier, NextConcept } from "@/lib/config";

// ============================================================================
// TYPES
// ============================================================================

interface RoutesSectionProps {
  /** Whether the user has signed up */
  hasSignedUp: boolean;
  /** Whether routes data is loading */
  routesLoading: boolean;
  /** Sorted routes (highest impact first) */
  sortedRoutes: LearningRouteData[];
  /** Low-hanging fruit data */
  lowHangingFruit?: { oneAway: number; twoAway: number } | null;
  /** Whether the expanded toggle is active */
  showMoreDetails: boolean;
  /** Toggle handler (with analytics tracking) */
  onToggle: () => void;
  /** Whether to show next concepts */
  showNextConcepts: boolean;
  /** Next concepts to display */
  nextConcepts: NextConcept[];
  /** Performance tier for next concepts display */
  performanceTier: PerformanceTier;
  /** CTA click handler (preview mode only) */
  onCtaClick: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Recommended route card with loading state */
function RecommendedRouteBlock({
  routesLoading,
  sortedRoutes,
}: Pick<RoutesSectionProps, "routesLoading" | "sortedRoutes">) {
  return (
    <div>
      <p className="text-sm text-cool-gray mb-3 text-center">
        Tu ruta de mayor impacto:
      </p>
      {routesLoading ? (
        <div className="card p-6 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : sortedRoutes.length > 0 ? (
        <SimpleRouteCard route={sortedRoutes[0]} isRecommended={true} />
      ) : null}
    </div>
  );
}

/** Low-hanging fruit indicator */
function LowHangingFruitLine({
  lowHangingFruit,
}: {
  lowHangingFruit?: { oneAway: number; twoAway: number } | null;
}) {
  if (!lowHangingFruit || lowHangingFruit.oneAway <= 0) return null;
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-cool-gray">
      {Icons.lightbulb("w-4 h-4 text-success")}
      <span>
        Tienes{" "}
        <strong className="text-success">{lowHangingFruit.oneAway}</strong>{" "}
        preguntas a 1 sola mini-clase de distancia.
      </span>
    </div>
  );
}

/** Collapsible "other routes" list with toggle button */
function OtherRoutesToggle({
  sortedRoutes,
  showMoreDetails,
  onToggle,
}: Pick<RoutesSectionProps, "sortedRoutes" | "showMoreDetails" | "onToggle">) {
  if (sortedRoutes.length <= 1) return null;
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-primary text-sm font-medium flex items-center justify-center gap-1.5 py-2 hover:text-primary-light transition-colors"
        aria-expanded={showMoreDetails}
      >
        {showMoreDetails ? (
          <>
            <ChevronUp />
            Ocultar otras rutas
          </>
        ) : (
          <>
            Ver otras rutas disponibles ({sortedRoutes.length - 1})
            <ChevronDown />
          </>
        )}
      </button>
      {showMoreDetails && (
        <div className="mt-3 space-y-3 animate-fadeIn">
          {sortedRoutes.slice(1, 4).map((route) => (
            <SimpleRouteCard
              key={route.axis}
              route={route}
              isRecommended={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ICON HELPERS (tiny chevrons used only here)
// ============================================================================

function ChevronUp() {
  return (
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
  );
}

function ChevronDown() {
  return (
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
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RoutesSection({
  hasSignedUp,
  routesLoading,
  sortedRoutes,
  lowHangingFruit,
  showMoreDetails,
  onToggle,
  showNextConcepts,
  nextConcepts,
  performanceTier,
  onCtaClick,
}: RoutesSectionProps) {
  // Signed-up users: show routes directly (no toggle needed)
  if (hasSignedUp) {
    return (
      <div className="space-y-6 text-left">
        <RecommendedRouteBlock
          routesLoading={routesLoading}
          sortedRoutes={sortedRoutes}
        />
        <LowHangingFruitLine lowHangingFruit={lowHangingFruit} />

        {showNextConcepts && nextConcepts.length > 0 && (
          <NextConceptsPreview tier={performanceTier} concepts={nextConcepts} />
        )}

        <OtherRoutesToggle
          sortedRoutes={sortedRoutes}
          showMoreDetails={showMoreDetails}
          onToggle={onToggle}
        />
      </div>
    );
  }

  // Preview mode: routes behind a toggle
  return (
    <div className="text-center">
      <button
        onClick={onToggle}
        className="text-primary text-sm font-medium flex items-center gap-1.5 mx-auto hover:text-primary-light transition-colors"
        aria-expanded={showMoreDetails}
      >
        {showMoreDetails ? (
          <>
            <ChevronUp />
            Ocultar detalles
          </>
        ) : (
          <>
            Explorar mi ruta personalizada
            <ChevronDown />
          </>
        )}
      </button>

      {showMoreDetails && (
        <div className="mt-6 space-y-6 animate-fadeIn text-left">
          <RecommendedRouteBlock
            routesLoading={routesLoading}
            sortedRoutes={sortedRoutes}
          />
          <LowHangingFruitLine lowHangingFruit={lowHangingFruit} />

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

          {/* Secondary CTA */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-cool-gray mb-3">
              ¿Listo para comenzar tu ruta?
            </p>
            <button
              onClick={onCtaClick}
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
        </div>
      )}
    </div>
  );
}
