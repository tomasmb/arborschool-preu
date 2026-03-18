"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { M1GoalContext } from "@/app/api/student/goals/m1-context/route";

type Props = {
  scoreMin: number;
  scoreMax: number;
  totalCorrect: number;
  onConfirmGoal: (m1Target: number) => void;
  onSkip: () => void;
};

const TEST_LABELS: Record<string, string> = {
  CL: "Lenguaje",
  M2: "Matemática 2",
  CIENCIAS: "Ciencias",
  HISTORIA: "Historia",
};

function formatTestName(code: string): string {
  return TEST_LABELS[code] ?? code;
}

async function fetchM1Context(): Promise<M1GoalContext | null> {
  try {
    const res = await fetch("/api/student/goals/m1-context", {
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

async function saveM1Target(score: number): Promise<boolean> {
  try {
    const res = await fetch("/api/student/goals/primary-score", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testCode: "M1", score }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function StudentResultsHandoffScreen({
  scoreMin,
  scoreMax,
  totalCorrect,
  onConfirmGoal,
  onSkip,
}: Props) {
  const midScore = Math.round((scoreMin + scoreMax) / 2);
  const [ctx, setCtx] = useState<M1GoalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [m1Input, setM1Input] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchM1Context().then((data) => {
      setCtx(data);
      if (data?.suggestedM1Target) {
        setM1Input(String(data.suggestedM1Target));
      } else if (data?.currentM1Score) {
        setM1Input(String(data.currentM1Score));
      }
      setLoading(false);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    const parsed = Math.round(Number(m1Input));
    if (!Number.isFinite(parsed) || parsed < 100 || parsed > 1000) {
      inputRef.current?.focus();
      return;
    }

    setSaving(true);
    const ok = await saveM1Target(parsed);
    setSaving(false);

    if (ok) {
      onConfirmGoal(parsed);
    } else {
      onConfirmGoal(parsed);
    }
  }, [m1Input, onConfirmGoal]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-off-white">
      <header
        className="bg-white/80 backdrop-blur-lg border-b border-gray-100
          sticky top-0 z-20"
      >
        <div
          className="max-w-4xl mx-auto px-4 py-4 flex items-center
            justify-center gap-3"
        >
          <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
          <span className="text-xl font-serif font-bold text-primary">
            Arbor PreU
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Score celebration */}
        <section
          className="rounded-2xl border border-primary/20 bg-white p-6
            space-y-2 text-center"
        >
          <p
            className="text-xs uppercase tracking-wide text-primary
              font-semibold"
          >
            Diagnóstico completado
          </p>
          <h1 className="text-4xl font-serif font-bold text-primary">
            {midScore}
          </h1>
          <p className="text-sm text-gray-600">
            Puntaje M1 estimado · banda {scoreMin}–{scoreMax}
          </p>
          <p className="text-xs text-gray-400">{totalCorrect}/16 correctas</p>
        </section>

        {/* M1 goal setter */}
        {loading ? (
          <section
            className="rounded-2xl border border-gray-200 bg-white p-6
              animate-pulse"
          >
            <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </section>
        ) : (
          <section
            className="rounded-2xl border border-gray-200 bg-white p-6
              space-y-4"
          >
            <h2 className="text-lg font-serif font-semibold text-primary">
              Define tu meta M1
            </h2>

            {ctx?.hasCareerGoal ? (
              <p className="text-sm text-gray-600">
                Tu carrera{" "}
                <span className="font-medium text-gray-900">
                  {ctx.careerName} — {ctx.universityName}
                </span>
                {ctx.lastCutoff ? (
                  <>
                    {" "}
                    tuvo último corte de{" "}
                    <span className="font-semibold text-primary">
                      {Math.round(ctx.lastCutoff)}
                    </span>
                    .
                  </>
                ) : (
                  "."
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Elige un puntaje objetivo para M1. Un buen punto de partida es
                +50 pts sobre tu diagnóstico.
              </p>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="m1-target"
                className="text-sm font-medium text-gray-700"
              >
                Tu meta M1
              </label>
              <input
                ref={inputRef}
                id="m1-target"
                type="number"
                min={100}
                max={1000}
                step={1}
                value={m1Input}
                onChange={(e) => setM1Input(e.target.value)}
                placeholder={String(midScore + 50)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50
                  px-4 py-3 text-lg font-semibold tabular-nums text-center
                  focus:border-primary focus:ring-2 focus:ring-primary/10
                  focus:outline-none transition-all"
              />
              {ctx?.suggestedM1Target && (
                <p className="text-xs text-gray-400 text-center">
                  Sugerido: corte {Math.round(ctx.lastCutoff ?? 0)} +{" "}
                  {ctx.bufferPoints} pts de margen
                </p>
              )}
            </div>

            {ctx?.otherRequiredTests && ctx.otherRequiredTests.length > 0 && (
              <div
                className="rounded-lg bg-gray-50 border border-gray-100
                  px-4 py-3"
              >
                <p className="text-xs text-gray-500">
                  Tu carrera también pondera{" "}
                  <span className="font-medium text-gray-700">
                    {ctx.otherRequiredTests.map(formatTestName).join(", ")}
                  </span>
                  . Pronto en Arbor.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Actions */}
        <section className="space-y-3">
          <button
            type="button"
            disabled={saving || loading || !m1Input}
            onClick={handleConfirm}
            className="w-full btn-primary text-sm py-3 disabled:opacity-50
              disabled:cursor-not-allowed"
          >
            {saving ? "Guardando…" : "Confirmar meta e ir a mi portal"}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-sm text-gray-500 hover:text-gray-700
              transition-colors py-2"
          >
            Ir al portal sin confirmar
          </button>
        </section>
      </main>
    </div>
  );
}
