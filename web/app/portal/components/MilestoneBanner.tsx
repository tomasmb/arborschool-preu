"use client";

import { useEffect, useState } from "react";

type MilestoneType =
  | "first_sprint"
  | "streak_3"
  | "streak_7"
  | "mission_complete"
  | "mastery_pct_25"
  | "mastery_pct_50"
  | "mastery_pct_75"
  | "mastery_pct_90"
  | null;

type MilestoneBannerProps = {
  completedSessions: number;
  targetSessions: number;
  masteredAtoms: number;
  totalAtoms: number;
};

function getMasteryMilestone(
  masteredAtoms: number,
  totalAtoms: number
): { type: MilestoneType; title: string; subtitle: string } | null {
  if (totalAtoms === 0) return null;
  const pct = (masteredAtoms / totalAtoms) * 100;

  if (pct >= 90)
    return {
      type: "mastery_pct_90",
      title: `${masteredAtoms} conceptos dominados`,
      subtitle: "Dominio casi completo. La PAES es tuya.",
    };
  if (pct >= 75)
    return {
      type: "mastery_pct_75",
      title: `${masteredAtoms} conceptos dominados`,
      subtitle: "Tres cuartos del camino recorrido. Vas con todo.",
    };
  if (pct >= 50)
    return {
      type: "mastery_pct_50",
      title: `${masteredAtoms} conceptos dominados`,
      subtitle: "Más de la mitad del contenido dominado. La PAES no te asusta.",
    };
  if (pct >= 25)
    return {
      type: "mastery_pct_25",
      title: `${masteredAtoms} conceptos dominados`,
      subtitle: "Tu base de conocimiento crece. Cada concepto suma.",
    };
  return null;
}

const STREAK_MESSAGES: Record<
  "first_sprint" | "streak_3" | "streak_7" | "mission_complete",
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
};

type ResolvedMilestone = {
  type: Exclude<MilestoneType, null>;
  emoji: string;
  title: string;
  subtitle: string;
};

function detectMilestone(
  props: MilestoneBannerProps
): ResolvedMilestone | null {
  const { completedSessions, targetSessions, masteredAtoms, totalAtoms } =
    props;

  if (completedSessions >= targetSessions && targetSessions > 0) {
    const m = STREAK_MESSAGES.mission_complete;
    return { type: "mission_complete", ...m };
  }
  if (completedSessions >= 7) {
    const m = STREAK_MESSAGES.streak_7;
    return { type: "streak_7", ...m };
  }
  if (completedSessions >= 3) {
    const m = STREAK_MESSAGES.streak_3;
    return { type: "streak_3", ...m };
  }

  const mastery = getMasteryMilestone(masteredAtoms, totalAtoms);
  if (mastery) {
    const emojiMap: Record<string, string> = {
      mastery_pct_25: "📚",
      mastery_pct_50: "🏆",
      mastery_pct_75: "🧠",
      mastery_pct_90: "🌟",
    };
    return {
      type: mastery.type!,
      emoji: emojiMap[mastery.type!] ?? "📚",
      title: mastery.title,
      subtitle: mastery.subtitle,
    };
  }

  if (completedSessions === 1) {
    const m = STREAK_MESSAGES.first_sprint;
    return { type: "first_sprint", ...m };
  }

  return null;
}

const STORAGE_KEY = "arbor_dismissed_milestone";

export function MilestoneBanner(props: MilestoneBannerProps) {
  const resolved = detectMilestone(props);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!resolved) return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setDismissed(stored === resolved.type);
  }, [resolved]);

  if (!resolved || dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, resolved!.type);
    setDismissed(true);
  }

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-gradient-to-r
        from-amber-50 to-orange-50 p-4 sm:p-5
        flex items-center gap-4 animate-fade-in-up"
    >
      <span className="text-3xl">{resolved.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">{resolved.title}</p>
        <p className="text-xs text-amber-700 mt-0.5">{resolved.subtitle}</p>
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
