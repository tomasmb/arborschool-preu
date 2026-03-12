"use client";

import Image from "next/image";

type StudentResultsHandoffScreenProps = {
  scoreMin: number;
  scoreMax: number;
  totalCorrect: number;
  confidenceLevel: "low" | "medium" | "high";
  confidenceExplanation: string;
  targetGapLabel: string;
  firstAction: {
    estimatedMinutes: number;
    expectedPointsBand: string;
    whyFirst: string;
  };
  onStartStudy: () => void;
  onAdjustGoal: () => void;
};

function confidenceBadge(
  level: StudentResultsHandoffScreenProps["confidenceLevel"]
) {
  if (level === "high") {
    return "Confianza alta";
  }
  if (level === "medium") {
    return "Confianza media";
  }
  return "Confianza inicial";
}

export function StudentResultsHandoffScreen({
  scoreMin,
  scoreMax,
  totalCorrect,
  confidenceLevel,
  confidenceExplanation,
  targetGapLabel,
  firstAction,
  onStartStudy,
  onAdjustGoal,
}: StudentResultsHandoffScreenProps) {
  const midScore = Math.round((scoreMin + scoreMax) / 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-off-white">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
          <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
          <span className="text-xl font-serif font-bold text-primary">
            Arbor PreU
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <section className="rounded-2xl border border-primary/20 bg-white p-6 space-y-2">
          <p className="text-xs uppercase tracking-wide text-primary font-semibold">
            Diagnóstico completado
          </p>
          <h1 className="text-3xl font-serif font-bold text-primary">
            Puntaje estimado {midScore}
          </h1>
          <p className="text-sm text-gray-700">
            Banda: {scoreMin} - {scoreMax} · {totalCorrect}/16 correctas
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
          <p className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 text-xs font-semibold px-3 py-1">
            {confidenceBadge(confidenceLevel)}
          </p>
          <p className="text-sm text-gray-700">{confidenceExplanation}</p>
          <p className="text-sm text-gray-700">{targetGapLabel}</p>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-2">
          <h2 className="text-xl font-serif font-semibold text-primary">
            Primera acción recomendada
          </h2>
          <p className="text-sm text-emerald-900">
            Mini-clase de {firstAction.estimatedMinutes} min · impacto esperado{" "}
            {firstAction.expectedPointsBand}
          </p>
          <p className="text-sm text-emerald-900">{firstAction.whyFirst}</p>
        </section>

        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStartStudy}
            className="btn-primary text-sm"
          >
            Comenzar mini-clase de hoy
          </button>
          <button
            type="button"
            onClick={onAdjustGoal}
            className="btn-ghost text-sm"
          >
            Ajustar meta
          </button>
        </section>
      </main>
    </div>
  );
}
