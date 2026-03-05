"use client";

import { useEffect, useState } from "react";

type MilestoneType =
  | "first_sprint"
  | "streak_3"
  | "streak_7"
  | "mission_complete"
  | "mastery_10"
  | "mastery_25"
  | "mastery_50"
  | null;

type MilestoneBannerProps = {
  completedSessions: number;
  targetSessions: number;
  masteredAtoms: number;
  totalAtoms: number;
};

const MILESTONE_MESSAGES: Record<
  Exclude<MilestoneType, null>,
  { emoji: string; title: string; subtitle: string }
> = {
  first_sprint: {
    emoji: "🎉",
    title: "Primera mini-clase completada",
    subtitle: "Ya diste tu primer paso hacia la PAES. Sigue así.",
  },
  streak_3: {
    emoji: "🔥",
    title: "3 sesiones esta semana",
    subtitle:
      "Gran consistencia. La constancia es clave para subir tu puntaje.",
  },
  streak_7: {
    emoji: "⚡",
    title: "7 sesiones esta semana",
    subtitle: "Ritmo increíble. Estás al nivel de los mejores estudiantes.",
  },
  mission_complete: {
    emoji: "✅",
    title: "Misión semanal completada",
    subtitle: "Cumpliste tu objetivo semanal. Ahora puedes seguir o descansar.",
  },
  mastery_10: {
    emoji: "📚",
    title: "10 conceptos dominados",
    subtitle:
      "Tu base de conocimiento crece. Cada concepto te acerca a tu meta.",
  },
  mastery_25: {
    emoji: "🧠",
    title: "25 conceptos dominados",
    subtitle: "Un cuarto del camino recorrido. Vas con todo.",
  },
  mastery_50: {
    emoji: "🏆",
    title: "50 conceptos dominados",
    subtitle: "Más de la mitad del contenido dominado. La PAES no te asusta.",
  },
};

function detectMilestone({
  completedSessions,
  targetSessions,
  masteredAtoms,
}: MilestoneBannerProps): MilestoneType {
  if (completedSessions >= targetSessions && targetSessions > 0)
    return "mission_complete";
  if (completedSessions >= 7) return "streak_7";
  if (completedSessions >= 3) return "streak_3";
  if (masteredAtoms >= 50) return "mastery_50";
  if (masteredAtoms >= 25) return "mastery_25";
  if (masteredAtoms >= 10) return "mastery_10";
  if (completedSessions === 1) return "first_sprint";
  return null;
}

const STORAGE_KEY = "arbor_dismissed_milestone";

export function MilestoneBanner(props: MilestoneBannerProps) {
  const milestone = detectMilestone(props);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!milestone) return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setDismissed(stored === milestone);
  }, [milestone]);

  if (!milestone || dismissed) return null;

  const msg = MILESTONE_MESSAGES[milestone];

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, milestone!);
    setDismissed(true);
  }

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-gradient-to-r
        from-amber-50 to-orange-50 p-4 sm:p-5
        flex items-center gap-4 animate-fade-in-up"
    >
      <span className="text-3xl">{msg.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">{msg.title}</p>
        <p className="text-xs text-amber-700 mt-0.5">{msg.subtitle}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label="Cerrar"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </section>
  );
}
