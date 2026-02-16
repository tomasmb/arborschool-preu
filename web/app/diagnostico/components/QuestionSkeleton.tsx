"use client";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Animated skeleton pulse bar for loading states.
 * Uses a base gray color with shimmer overlay effect.
 */
function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Skeleton loading state for question screen.
 * Mimics the layout of the actual question to reduce layout shift.
 */
export function QuestionSkeleton() {
  return (
    <div
      className="max-w-3xl mx-auto px-4 py-8"
      role="status"
      aria-label="Cargando pregunta"
    >
      <div className="card p-6 sm:p-10 relative overflow-hidden">
        {/* Decorative corner gradient (matches real card) */}
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full"
          aria-hidden="true"
        />

        {/* Question metadata badges skeleton */}
        <div className="flex flex-wrap items-center gap-2 mb-6 relative">
          <SkeletonBar className="w-24 h-7 rounded-lg" />
          <SkeletonBar className="w-28 h-7 rounded-lg" />
        </div>

        {/* Question content skeleton (2-3 lines of text) */}
        <div className="mb-6 sm:mb-8 space-y-3">
          <SkeletonBar className="w-full h-5" />
          <SkeletonBar className="w-5/6 h-5" />
          <SkeletonBar className="w-3/4 h-5" />
        </div>

        {/* Answer options skeleton (4 options with staggered animation) */}
        <div className="space-y-3 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Option letter circle */}
              <SkeletonBar className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0" />
              {/* Option text */}
              <div className="flex-1 space-y-2">
                <SkeletonBar className="w-full h-4" />
                <SkeletonBar className="w-2/3 h-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Skip question section skeleton */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <SkeletonBar className="w-full h-10 rounded-lg" />
        </div>

        {/* Next button skeleton */}
        <div className="mt-6 sm:mt-8 flex justify-end">
          <SkeletonBar className="w-32 h-12 rounded-xl" />
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Cargando pregunta, por favor espera...</span>
    </div>
  );
}
