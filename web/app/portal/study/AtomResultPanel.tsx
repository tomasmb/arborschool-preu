"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Confetti } from "@/app/diagnostico/components/Confetti";
import type { SessionStatus } from "@/lib/student/atomMasteryAlgorithm";

type AtomResultPanelProps = {
  status: SessionStatus;
  atomTitle: string;
  totalAnswered: number;
  totalCorrect: number;
  attemptNumber: number;
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

export function AtomResultPanel({
  status,
  atomTitle,
  totalAnswered,
  totalCorrect,
  attemptNumber,
}: AtomResultPanelProps) {
  const [showContent, setShowContent] = useState(false);
  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const isMastered = status === "mastered";

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative">
      {isMastered && (
        <Confetti variant="burst" duration={3000} particleCount={80} />
      )}

      <section
        className={[
          "rounded-2xl p-6 sm:p-8 space-y-6 border",
          "transition-all duration-700",
          isMastered
            ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
            : "bg-gradient-to-br from-rose-50 to-white border-rose-200",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
      >
        <div className="text-center space-y-2">
          <div
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5",
              "text-sm font-medium",
              isMastered
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700",
            ].join(" ")}
          >
            {isMastered ? <CheckIcon /> : <AlertIcon />}
            {isMastered ? "Concepto dominado" : "Necesitas reforzar"}
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
            {atomTitle}
          </h2>

          {!isMastered && (
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {attemptNumber < 3
                ? "No te preocupes — repasa el material y vuelve a intentarlo."
                : "Has usado todos los intentos. Refuerza los prerrequisitos."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <AnimatedStat
            label="Respondidas"
            value={String(totalAnswered)}
            delay={400}
          />
          <AnimatedStat label="Precisión" value={`${accuracy}%`} delay={600} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/portal" className="btn-cta text-center text-sm">
            {isMastered ? "Siguiente concepto" : "Continuar"}
          </Link>
          <Link href="/portal" className="btn-secondary text-center">
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Inline SVG icons ── */

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertIcon() {
  return (
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
        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
