"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GoalOption = {
  offeringId: string;
  careerName: string;
  universityName: string;
  lastCutoff: number | null;
  cutoffYear: number | null;
};

type GoalRecord = {
  offeringId: string;
  priority: number;
};

type StudentGoalsPayload = {
  dataset: {
    version: string;
    source: string;
    publishedAt: string;
  } | null;
  options: GoalOption[];
  goals: {
    offeringId: string;
    priority: number;
  }[];
};

const MAX_PRIMARY_GOALS = 3;

export default function PortalGoalsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<StudentGoalsPayload["dataset"]>(null);
  const [options, setOptions] = useState<GoalOption[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([
    { offeringId: "", priority: 1 },
  ]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/student/goals", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar objetivos");
        }

        const payload = (await response.json()) as {
          success: boolean;
          data?: StudentGoalsPayload;
        };

        if (!payload.success || !payload.data) {
          throw new Error("Respuesta inválida de objetivos");
        }

        if (!isMounted) {
          return;
        }

        setDataset(payload.data.dataset);
        setOptions(payload.data.options);

        if (payload.data.goals.length > 0) {
          setGoals(
            payload.data.goals
              .sort((a, b) => a.priority - b.priority)
              .slice(0, MAX_PRIMARY_GOALS)
              .map((goal) => ({
                offeringId: goal.offeringId,
                priority: goal.priority,
              }))
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar objetivos"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const availableOptions = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        label: `${option.careerName} — ${option.universityName}`,
      })),
    [options]
  );

  function setGoalOffering(priority: number, offeringId: string) {
    setGoals((current) =>
      current.map((goal) =>
        goal.priority === priority ? { ...goal, offeringId } : goal
      )
    );
  }

  function addGoalSlot() {
    setGoals((current) => {
      if (current.length >= MAX_PRIMARY_GOALS) {
        return current;
      }
      return [...current, { offeringId: "", priority: current.length + 1 }];
    });
  }

  function removeGoalSlot(priority: number) {
    setGoals((current) =>
      current
        .filter((goal) => goal.priority !== priority)
        .map((goal, index) => ({ ...goal, priority: index + 1 }))
    );
  }

  async function handleSave() {
    const filled = goals.filter((goal) => goal.offeringId !== "");
    if (filled.length === 0) {
      setError("Selecciona al menos un objetivo");
      return;
    }

    const unique = new Set(filled.map((goal) => goal.offeringId));
    if (unique.size !== filled.length) {
      setError("No puedes repetir la misma carrera/universidad");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/student/goals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: filled.map((goal) => ({
            offeringId: goal.offeringId,
            priority: goal.priority,
            isPrimary: true,
            bufferPoints: 30,
            bufferSource: "system",
          })),
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
        data?: StudentGoalsPayload;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "No se pudo guardar objetivos");
      }

      setDataset(payload.data.dataset);
      setGoals(
        payload.data.goals
          .sort((a, b) => a.priority - b.priority)
          .map((goal) => ({
            offeringId: goal.offeringId,
            priority: goal.priority,
          }))
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar objetivos"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Portal estudiante</p>
            <h1 className="text-3xl font-serif font-bold text-primary">
              Objetivos y admisión
            </h1>
          </div>
          <Link
            href="/portal"
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Volver al portal
          </Link>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-xl font-serif font-semibold text-primary">
            Tus metas principales (máximo 3)
          </h2>

          {dataset && (
            <p className="text-xs text-gray-500">
              Dataset {dataset.version} · Publicado{" "}
              {new Date(dataset.publishedAt).toLocaleDateString("es-CL")} ·{" "}
              {dataset.source}
            </p>
          )}

          {loading && <p className="text-gray-600">Cargando objetivos...</p>}

          {!loading && (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.priority}
                  className="grid gap-2 sm:grid-cols-[80px_1fr_auto] items-center"
                >
                  <span className="text-sm font-medium text-gray-700">
                    Meta {goal.priority}
                  </span>
                  <select
                    value={goal.offeringId}
                    onChange={(event) =>
                      setGoalOffering(goal.priority, event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona carrera y universidad</option>
                    {availableOptions.map((option) => (
                      <option key={option.offeringId} value={option.offeringId}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoalSlot(goal.priority)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && goals.length < MAX_PRIMARY_GOALS && (
            <button
              type="button"
              onClick={addGoalSlot}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Agregar meta
            </button>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className={[
                "inline-flex items-center rounded-lg bg-primary text-white px-4 py-2",
                "text-sm font-semibold hover:bg-primary/90 disabled:opacity-50",
              ].join(" ")}
            >
              {saving ? "Guardando..." : "Guardar objetivos"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
