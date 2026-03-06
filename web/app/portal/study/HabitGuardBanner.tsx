"use client";

import Link from "next/link";

export type HabitGuardSuggestion =
  | "take_break"
  | "switch_to_review"
  | "slow_down";

const HABIT_MESSAGES: Record<
  HabitGuardSuggestion,
  { title: string; body: string; cta?: { label: string; href: string } }
> = {
  switch_to_review: {
    title: "Cambia de modo",
    body: "Llevas varias respuestas incorrectas seguidas. Te sugerimos hacer un repaso para reforzar lo aprendido.",
    cta: { label: "Ir a repaso", href: "/portal/study?mode=review" },
  },
  take_break: {
    title: "Toma un descanso",
    body: "Llevas varias respuestas incorrectas seguidas. Un breve descanso puede ayudarte a volver con la mente fresca.",
  },
  slow_down: {
    title: "Excelente ritmo hoy",
    body: "Has dominado muchos conceptos hoy. Estudiar de más puede reducir la retención — considera parar por hoy.",
  },
};

export function HabitGuardBanner({
  suggestion,
}: {
  suggestion: HabitGuardSuggestion;
}) {
  const msg = HABIT_MESSAGES[suggestion];
  return (
    <section
      className="rounded-2xl border border-blue-200 bg-blue-50 p-4
        space-y-2 animate-fade-in-up"
    >
      <p className="text-sm font-semibold text-blue-800">{msg.title}</p>
      <p className="text-xs text-blue-700">{msg.body}</p>
      {msg.cta && (
        <Link
          href={msg.cta.href}
          className="inline-block text-xs font-medium text-primary
            hover:text-primary/80 transition-colors"
        >
          {msg.cta.label} →
        </Link>
      )}
    </section>
  );
}
