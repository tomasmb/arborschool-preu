"use client";

type StreakBadgeProps = {
  /** Number of sessions completed this week */
  sessionsThisWeek: number;
  /** Compact mode for inline use (e.g. nav bar) */
  compact?: boolean;
};

/**
 * Visual streak/momentum indicator based on weekly session count.
 * Uses a flame icon like Duolingo to reward consistency.
 */
export function StreakBadge({
  sessionsThisWeek,
  compact = false,
}: StreakBadgeProps) {
  const isActive = sessionsThisWeek > 0;

  if (compact) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1 text-sm font-bold",
          isActive ? "text-amber-500" : "text-gray-300",
        ].join(" ")}
      >
        <svg
          className={`w-4 h-4 ${isActive ? "animate-bounce-subtle" : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.037 2.068-5.492 3.678-7.283.593-.66 1.143-1.27 1.572-1.867.26-.362.686-.85 1.25-.85s.99.488 1.25.85c.429.597.979 1.207 1.572 1.867C15.932 10.508 18 12.963 18 16c0 3.866-3.134 7-7 7z" />
        </svg>
        {sessionsThisWeek}
      </span>
    );
  }

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2",
        "text-sm font-semibold transition-colors",
        isActive
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-gray-50 text-gray-400 border border-gray-200",
      ].join(" ")}
    >
      <svg
        className={[
          "w-5 h-5",
          isActive ? "text-amber-500" : "text-gray-300",
        ].join(" ")}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.037 2.068-5.492 3.678-7.283.593-.66 1.143-1.27 1.572-1.867.26-.362.686-.85 1.25-.85s.99.488 1.25.85c.429.597.979 1.207 1.572 1.867C15.932 10.508 18 12.963 18 16c0 3.866-3.134 7-7 7z" />
      </svg>
      <span>
        {sessionsThisWeek} sesión{sessionsThisWeek !== 1 ? "es" : ""} esta
        semana
      </span>
    </div>
  );
}
