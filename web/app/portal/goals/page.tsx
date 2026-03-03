"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  trackStudentGoalsSaved,
  trackStudentSimulatorInteraction,
} from "@/lib/analytics";
import { GoalsEditorSection } from "./GoalsEditorSection";
import { SimulatorSection } from "./SimulatorSection";
import {
  GoalDraft,
  GoalRecord,
  MAX_PRIMARY_GOALS,
  SimulatorPayload,
  StudentGoal,
  StudentGoalsPayload,
} from "./types";
import { normalizeTestCode, toDraft } from "./utils";

export default function PortalGoalsPage() {
  const simulatorInteractionTracked = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);

  const [dataset, setDataset] = useState<StudentGoalsPayload["dataset"]>(null);
  const [options, setOptions] = useState<StudentGoalsPayload["options"]>([]);
  const [savedGoals, setSavedGoals] = useState<StudentGoal[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([
    { offeringId: "", priority: 1 },
  ]);
  const [drafts, setDrafts] = useState<Record<string, GoalDraft>>({});
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulatorPayload | null>(null);

  const optionByOffering = useMemo(
    () => new Map(options.map((option) => [option.offeringId, option])),
    [options]
  );

  const availableOptions = useMemo(
    () =>
      options.map((option) => ({
        offeringId: option.offeringId,
        label: `${option.careerName} — ${option.universityName}`,
      })),
    [options]
  );

  const selectedGoal = useMemo(
    () => savedGoals.find((goal) => goal.id === selectedGoalId) ?? null,
    [savedGoals, selectedGoalId]
  );

  const selectedOption = useMemo(() => {
    if (!selectedGoal) {
      return null;
    }

    return optionByOffering.get(selectedGoal.offeringId) ?? null;
  }, [selectedGoal, optionByOffering]);

  const selectedDraft = useMemo(() => {
    if (!selectedGoalId) {
      return null;
    }

    return drafts[selectedGoalId] ?? null;
  }, [drafts, selectedGoalId]);

  function applyPayload(data: StudentGoalsPayload) {
    const orderedGoals = [...data.goals].sort(
      (a, b) => a.priority - b.priority
    );
    setDataset(data.dataset);
    setOptions(data.options);
    setSavedGoals(orderedGoals);

    if (orderedGoals.length === 0) {
      setGoals([{ offeringId: "", priority: 1 }]);
      setDrafts({});
      setSelectedGoalId(null);
      setSimulation(null);
      return;
    }

    setGoals(
      orderedGoals.slice(0, MAX_PRIMARY_GOALS).map((goal) => ({
        id: goal.id,
        offeringId: goal.offeringId,
        priority: goal.priority,
      }))
    );

    const nextDrafts: Record<string, GoalDraft> = {};
    for (const goal of orderedGoals) {
      const option = data.options.find(
        (item) => item.offeringId === goal.offeringId
      );
      nextDrafts[goal.id] = toDraft(goal, option);
    }
    setDrafts(nextDrafts);

    setSelectedGoalId((current) => {
      if (current && orderedGoals.some((goal) => goal.id === current)) {
        return current;
      }
      return orderedGoals[0].id;
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const loadGoals = async (): Promise<{
          success: boolean;
          error?: string;
          data?: StudentGoalsPayload;
        }> => {
          const response = await fetch("/api/student/goals", {
            method: "GET",
            credentials: "include",
          });
          const payload = (await response.json()) as {
            success: boolean;
            error?: string;
            data?: StudentGoalsPayload;
          };

          if (!response.ok || !payload.success) {
            throw new Error(payload.error ?? "No se pudo cargar objetivos");
          }

          return payload;
        };

        const payload = await loadGoals();
        if (!payload.data) {
          throw new Error("Respuesta inválida de objetivos");
        }

        if (!isMounted) {
          return;
        }

        applyPayload(payload.data);
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

  useEffect(() => {
    if (!selectedGoal || !selectedOption || !selectedGoalId || !selectedDraft) {
      setSimulation(null);
      setSimulatorError(null);
      return;
    }

    const goalId = selectedGoalId;
    const draft = selectedDraft;
    const option = selectedOption;
    const controller = new AbortController();

    async function runSimulator() {
      setSimLoading(true);
      setSimulatorError(null);

      try {
        const params = new URLSearchParams();
        params.set("goalId", goalId);
        params.set("bufferPoints", String(draft.bufferPoints));

        for (const weight of option.weights) {
          const testCode = normalizeTestCode(weight.testCode);
          const rawValue = draft.scores[testCode]?.trim() ?? "";
          params.set(testCode, rawValue);
        }

        const response = await fetch(
          `/api/student/simulator?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const payload = (await response.json()) as {
          success: boolean;
          error?: string;
          data?: SimulatorPayload;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "No se pudo calcular simulación");
        }

        if (!controller.signal.aborted) {
          setSimulation(payload.data);
        }
      } catch (simError) {
        if (!controller.signal.aborted) {
          setSimulatorError(
            simError instanceof Error
              ? simError.message
              : "No se pudo calcular simulación"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSimLoading(false);
        }
      }
    }

    runSimulator();

    return () => {
      controller.abort();
    };
  }, [selectedDraft, selectedGoal, selectedGoalId, selectedOption]);

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

  function updateGoalDraft(
    goalId: string,
    next: (draft: GoalDraft) => GoalDraft
  ) {
    setDrafts((current) => {
      const draft = current[goalId] ?? { bufferPoints: 30, scores: {} };
      return {
        ...current,
        [goalId]: next(draft),
      };
    });
  }

  function updateDraftScore(goalId: string, testCode: string, value: string) {
    if (!simulatorInteractionTracked.current) {
      trackStudentSimulatorInteraction("score_input");
      simulatorInteractionTracked.current = true;
    }

    const normalized = normalizeTestCode(testCode);
    updateGoalDraft(goalId, (goalDraft) => {
      return {
        ...goalDraft,
        scores: {
          ...goalDraft.scores,
          [normalized]: value,
        },
      };
    });
  }

  function updateDraftBuffer(goalId: string, value: string) {
    if (!simulatorInteractionTracked.current) {
      trackStudentSimulatorInteraction("buffer_change");
      simulatorInteractionTracked.current = true;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    updateGoalDraft(goalId, (goalDraft) => {
      return {
        ...goalDraft,
        bufferPoints: Math.round(parsed),
      };
    });
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

    for (const goal of savedGoals) {
      const draft = drafts[goal.id];
      if (!draft) {
        continue;
      }

      for (const [testCode, rawValue] of Object.entries(draft.scores)) {
        if (rawValue.trim().length === 0) {
          continue;
        }

        const score = Number(rawValue);
        if (!Number.isFinite(score) || score < 100 || score > 1000) {
          setError(`El puntaje ${testCode} debe estar entre 100 y 1000`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    try {
      const payloadGoals = filled.map((goal) => {
        const existingGoal = savedGoals.find(
          (savedGoal) => savedGoal.offeringId === goal.offeringId
        );
        const option = optionByOffering.get(goal.offeringId);
        const draft = existingGoal ? drafts[existingGoal.id] : undefined;

        const scoreRows = (option?.weights ?? [])
          .map((weight) => normalizeTestCode(weight.testCode))
          .map((testCode) => {
            const raw = draft?.scores[testCode]?.trim() ?? "";
            if (raw.length === 0) {
              return null;
            }

            return {
              testCode,
              score: Number(raw),
              source: "student" as const,
            };
          })
          .filter(
            (
              score
            ): score is {
              testCode: string;
              score: number;
              source: "student";
            } => score !== null
          );

        return {
          offeringId: goal.offeringId,
          priority: goal.priority,
          isPrimary: true,
          bufferPoints: draft?.bufferPoints ?? 30,
          bufferSource: "student" as const,
          scores: scoreRows,
        };
      });

      const response = await fetch("/api/student/goals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: payloadGoals }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
        data?: StudentGoalsPayload;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "No se pudo guardar objetivos");
      }

      trackStudentGoalsSaved(
        savedGoals.length === 0 ? "create" : "update",
        payloadGoals.length,
        payloadGoals.filter((goal) => goal.isPrimary).length
      );
      applyPayload(payload.data);
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

        <GoalsEditorSection
          dataset={dataset}
          loading={loading}
          saving={saving}
          goals={goals}
          options={availableOptions}
          error={error}
          onSetGoalOffering={setGoalOffering}
          onAddGoalSlot={addGoalSlot}
          onRemoveGoalSlot={removeGoalSlot}
          onSave={handleSave}
        />

        <SimulatorSection
          loading={loading}
          simLoading={simLoading}
          simulatorError={simulatorError}
          savedGoals={savedGoals}
          selectedGoalId={selectedGoalId}
          selectedGoal={selectedGoal}
          selectedOption={selectedOption}
          selectedDraft={selectedDraft}
          simulation={simulation}
          onSelectGoal={setSelectedGoalId}
          onUpdateDraftScore={updateDraftScore}
          onUpdateDraftBuffer={updateDraftBuffer}
        />
      </div>
    </main>
  );
}
