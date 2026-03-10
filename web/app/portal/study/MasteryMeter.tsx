"use client";

import type { SessionDifficulty } from "@/lib/student/atomMasteryAlgorithm";

type MasteryMeterProps = {
  difficulty: SessionDifficulty;
  consecutiveCorrect: number;
  totalAnswered: number;
  totalCorrect: number;
};

const PHASES: {
  key: SessionDifficulty;
  label: string;
  color: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    key: "easy",
    label: "Fácil",
    color: "bg-emerald-200",
    activeBg: "bg-emerald-500",
    activeText: "text-white",
  },
  {
    key: "medium",
    label: "Medio",
    color: "bg-amber-200",
    activeBg: "bg-amber-500",
    activeText: "text-white",
  },
  {
    key: "hard",
    label: "Difícil",
    color: "bg-rose-200",
    activeBg: "bg-rose-500",
    activeText: "text-white",
  },
];

const PHASE_INDEX: Record<SessionDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

/**
 * Visual mastery progress indicator.
 * Shows the three difficulty phases as a journey + a streak meter
 * that fills as the student gets consecutive correct answers.
 */
export function MasteryMeter({
  difficulty,
  consecutiveCorrect,
  totalAnswered,
  totalCorrect,
}: MasteryMeterProps) {
  const activeIdx = PHASE_INDEX[difficulty];
  const streak = Math.min(consecutiveCorrect, 3);
  const accuracy =
    totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 100)
      : 0;

  return (
    <div className="space-y-3">
      {/* Difficulty phase journey */}
      <div className="flex items-center gap-1">
        {PHASES.map((phase, idx) => {
          const isCurrent = idx === activeIdx;
          const isPast = idx < activeIdx;

          return (
            <div key={phase.key} className="flex items-center flex-1">
              <div
                className={[
                  "flex-1 h-2 rounded-full transition-all duration-500",
                  isCurrent
                    ? phase.activeBg
                    : isPast
                      ? phase.activeBg + " opacity-40"
                      : "bg-gray-200",
                ].join(" ")}
              />
              {idx < PHASES.length - 1 && (
                <div
                  className={[
                    "w-1.5 h-1.5 rounded-full mx-0.5 shrink-0",
                    "transition-all duration-500",
                    isPast ? "bg-gray-400" : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels + streak */}
      <div className="flex items-center justify-between">
        {/* Phase labels */}
        <div className="flex items-center gap-3">
          {PHASES.map((phase, idx) => {
            const isCurrent = idx === activeIdx;
            return (
              <span
                key={phase.key}
                className={[
                  "text-[10px] uppercase tracking-wider font-semibold",
                  "px-2 py-0.5 rounded-full transition-all duration-300",
                  isCurrent
                    ? `${phase.activeBg} ${phase.activeText}`
                    : "text-gray-400",
                ].join(" ")}
              >
                {phase.label}
              </span>
            );
          })}
        </div>

        {/* Consecutive correct streak dots */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-medium mr-1">
            Racha
          </span>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={[
                "w-3.5 h-3.5 rounded-full border-2 transition-all",
                "duration-300",
                i < streak
                  ? "bg-emerald-500 border-emerald-500 scale-110"
                  : "bg-white border-gray-300",
              ].join(" ")}
            >
              {i < streak && (
                <svg
                  className="w-full h-full text-white p-px"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compact accuracy stat */}
      {totalAnswered > 0 && (
        <p className="text-[11px] text-gray-400 text-right">
          {accuracy}% precisión
        </p>
      )}
    </div>
  );
}
