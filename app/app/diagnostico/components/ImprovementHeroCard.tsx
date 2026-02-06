"use client";

/**
 * ImprovementHeroCard Component
 *
 * A prominent card component for displaying the key value proposition:
 * "+X puntos en ~Y horas de estudio"
 *
 * Two variants:
 * - compact: For PartialResultsScreen (teaser before signup)
 * - hero: For ResultsScreen (prominent display after signup)
 *
 * UX Research Insights:
 * - Concrete value propositions with specific numbers are highly motivating
 * - Time-bounded goals reduce perceived effort
 * - Visual hierarchy should emphasize the improvement potential
 */

import { Icons } from "./shared";

// ============================================================================
// TYPES
// ============================================================================

interface ImprovementHeroCardProps {
  /** Points improvement potential */
  potentialImprovement: number;
  /** Study hours estimate */
  studyHours: number;
  /** Card variant: compact for teaser, hero for full display */
  variant?: "compact" | "hero";
  /** Whether to show loading skeleton */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formats study hours for display.
 * Shows hours for 1+ hours, minutes for less than 1 hour.
 */
export function formatStudyTime(hours: number): string {
  if (hours >= 1) {
    const rounded = Math.round(hours * 2) / 2;
    if (rounded === 1) return "~1 hora";
    return `~${rounded} horas`;
  }
  const minutes = Math.round(hours * 60);
  return `~${minutes} min`;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ImprovementSkeleton({ variant }: { variant: "compact" | "hero" }) {
  const isHero = variant === "hero";

  return (
    <div
      className={`card ${isHero ? "p-6" : "p-5"} bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border-amber-200`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {/* Icon skeleton */}
        <div
          className={`${isHero ? "w-12 h-12" : "w-10 h-10"} rounded-full bg-gray-200 animate-pulse`}
        />
        {/* Text skeleton */}
        <div className="space-y-2 w-full flex flex-col items-center">
          <div
            className={`${isHero ? "h-8 w-48" : "h-6 w-40"} bg-gray-200 rounded animate-pulse`}
          />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ImprovementHeroCard({
  potentialImprovement,
  studyHours,
  variant = "hero",
  isLoading = false,
  className = "",
}: ImprovementHeroCardProps) {
  // Show loading skeleton
  if (isLoading) {
    return <ImprovementSkeleton variant={variant} />;
  }

  // Don't render if no improvement data
  if (potentialImprovement <= 0 || studyHours <= 0) {
    return null;
  }

  const isHero = variant === "hero";
  const timeDisplay = formatStudyTime(studyHours);

  // Hero variant - prominent, larger, with glow animation
  if (isHero) {
    return (
      <div
        className={`card p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 
          border-amber-200 shadow-lg animate-glow-pulse ${className}`}
      >
        <div className="flex flex-col items-center text-center gap-4">
          {/* Trend up icon */}
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
            {Icons.trendUp("w-7 h-7 text-success")}
          </div>

          {/* Main value proposition */}
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold">
              <span className="text-success">
                +{potentialImprovement} puntos
              </span>
              <span className="text-cool-gray mx-2">en</span>
              <span className="text-charcoal">{timeDisplay}</span>
            </div>
            <p className="text-base text-cool-gray">de estudio enfocado</p>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant - for teaser/preview
  return (
    <div
      className={`card p-5 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 
        border-amber-200 ${className}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {/* Trend up icon */}
        <div className="w-11 h-11 rounded-full bg-success/10 flex items-center justify-center">
          {Icons.trendUp("w-5 h-5 text-success")}
        </div>

        {/* Value proposition */}
        <div className="space-y-1">
          <div className="text-lg sm:text-xl font-bold">
            <span className="text-success">+{potentialImprovement} puntos</span>
            <span className="text-cool-gray mx-1.5">en</span>
            <span className="text-charcoal">{timeDisplay}</span>
          </div>
          <p className="text-sm text-cool-gray">de estudio enfocado</p>
        </div>
      </div>
    </div>
  );
}
