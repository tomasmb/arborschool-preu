"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CompletionResponse, SprintData } from "./types";
import { StreakBadge } from "../components";
import { Confetti } from "@/app/diagnostico/components/Confetti";

type CompletionPanelProps = {
  sprint: SprintData;
  completion: CompletionResponse;
  answeredCount: number;
  correctCount: number;
  onCreateAnother: () => void;
};

function AnimatedStat({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={[
        "rounded-xl bg-white/80 border border-gray-100 p-4 text-center",
        "transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
    >
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export function CompletionPanel({
  sprint,
  completion,
  answeredCount,
  correctCount,
  onCreateAnother,
}: CompletionPanelProps) {
  const [showContent, setShowContent] = useState(false);
  const accuracy =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const missionDone =
    completion.mission.completedSessions >= completion.mission.targetSessions;

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative">
      <Confetti variant="burst" duration={3000} particleCount={80} />

      <section
        className={[
          "rounded-2xl bg-gradient-to-br from-emerald-50 to-white",
          "border border-emerald-200 p-6 sm:p-8 space-y-6",
          "transition-all duration-700",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Mini-clase completada
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
            {accuracy >= 80
              ? "Excelente sesión"
              : accuracy >= 50
                ? "Buen trabajo"
                : "Sesión completada"}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <AnimatedStat
            label="Respondidas"
            value={`${answeredCount}/${sprint.items.length}`}
            delay={400}
          />
          <AnimatedStat label="Correctas" value={`${accuracy}%`} delay={600} />
          <AnimatedStat
            label="Misión semanal"
            value={`${completion.mission.completedSessions}/${completion.mission.targetSessions}`}
            delay={800}
          />
        </div>

        <div className="flex justify-center">
          <StreakBadge
            sessionsThisWeek={completion.mission.completedSessions}
          />
        </div>

        {missionDone ? (
          <p className="text-center text-sm font-medium text-emerald-600 animate-fade-in-up">
            Completaste tu misión semanal
          </p>
        ) : (
          <p className="text-center text-sm text-gray-600">
            Te falta{" "}
            {completion.mission.targetSessions -
              completion.mission.completedSessions}{" "}
            sesión
            {completion.mission.targetSessions -
              completion.mission.completedSessions !==
            1
              ? "es"
              : ""}{" "}
            para completar la semana
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onCreateAnother}
            className="btn-cta text-sm"
          >
            Seguir estudiando
          </button>
          <Link href="/portal" className="btn-secondary text-center">
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}
