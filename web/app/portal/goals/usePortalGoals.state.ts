"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchGoals, DEFAULT_PLANNING_PROFILE, simulateGoal } from "./api";
import {
  type GoalDraft,
  type GoalRecord,
  MAX_PRIMARY_GOALS,
  type PlanningProfileDraft,
  type SimulatorPayload,
  type StudentGoal,
  type StudentGoalsPayload,
} from "./types";
import { normalizeTestCode, toDraft } from "./utils";

export type GoalsState = ReturnType<typeof useGoalsState>;

export function useGoalsState() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [dataset, setDataset] = useState<StudentGoalsPayload["dataset"]>(null);
  const [options, setOptions] = useState<StudentGoalsPayload["options"]>([]);
  const [savedGoals, setSavedGoals] = useState<StudentGoal[]>([]);
  const [journeyState, setJourneyState] = useState<
    StudentGoalsPayload["journeyState"] | null
  >(null);
  const [goals, setGoals] = useState<GoalRecord[]>([
    { offeringId: "", priority: 1 },
  ]);
  const [drafts, setDrafts] = useState<Record<string, GoalDraft>>({});
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [planningOfferingId, setPlanningOfferingId] = useState("");
  const [planningProfile, setPlanningProfile] = useState<PlanningProfileDraft>(
    DEFAULT_PLANNING_PROFILE
  );
  const [simulation, setSimulation] = useState<SimulatorPayload | null>(null);

  const optionByOffering = useMemo(
    () => new Map(options.map((option) => [option.offeringId, option])),
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

  const isDirty = useMemo(() => {
    if (loading) return false;
    const savedOfferings = savedGoals.map((g) => g.offeringId);
    const currentOfferings = goals.map((g) => g.offeringId);
    if (savedOfferings.length !== currentOfferings.length) return true;
    return savedOfferings.some((id, i) => id !== currentOfferings[i]);
  }, [loading, goals, savedGoals]);

  return {
    loading,
    saving,
    simLoading,
    loadError,
    error,
    simulatorError,
    infoMessage,
    dataset,
    options,
    savedGoals,
    journeyState,
    goals,
    drafts,
    selectedGoalId,
    planningOfferingId,
    planningProfile,
    simulation,
    optionByOffering,
    selectedGoal,
    selectedOption,
    selectedDraft,
    isDirty,
    setLoading,
    setSaving,
    setSimLoading,
    setLoadError,
    setError,
    setSimulatorError,
    setInfoMessage,
    setDataset,
    setOptions,
    setSavedGoals,
    setJourneyState,
    setGoals,
    setDrafts,
    setSelectedGoalId,
    setPlanningOfferingId,
    setPlanningProfile,
    setSimulation,
  };
}

export function applyGoalsPayload(
  state: GoalsState,
  data: StudentGoalsPayload
) {
  const orderedGoals = [...data.goals].sort((a, b) => a.priority - b.priority);
  state.setDataset(data.dataset);
  state.setOptions(data.options);
  state.setSavedGoals(orderedGoals);
  state.setJourneyState(data.journeyState);
  state.setPlanningProfile({
    examDate: data.planningProfile?.examDate ?? "",
    weeklyMinutesTarget: String(
      data.planningProfile?.weeklyMinutesTarget ?? 360
    ),
    reminderInApp: data.planningProfile?.reminderInApp ?? true,
    reminderEmail: data.planningProfile?.reminderEmail ?? true,
  });

  const primaryGoal = orderedGoals.find((goal) => goal.priority === 1);
  state.setPlanningOfferingId(primaryGoal?.offeringId ?? "");

  if (orderedGoals.length === 0) {
    state.setGoals([{ offeringId: "", priority: 1 }]);
    state.setDrafts({});
    state.setSelectedGoalId(null);
    state.setSimulation(null);
    return;
  }

  state.setGoals(
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
  state.setDrafts(nextDrafts);

  state.setSelectedGoalId((current) => {
    if (current && orderedGoals.some((goal) => goal.id === current)) {
      return current;
    }
    return orderedGoals[0].id;
  });
}

export function useGoalsLoader(state: GoalsState, loadRetryVersion: number) {
  useEffect(() => {
    let isMounted = true;

    async function load() {
      state.setLoading(true);
      state.setLoadError(null);
      state.setError(null);
      try {
        const payload = await fetchGoals();
        if (!isMounted) {
          return;
        }
        applyGoalsPayload(state, payload);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        state.setLoadError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar tus metas"
        );
      } finally {
        if (isMounted) {
          state.setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
    // Uses stable state setters only; reruns only when retry is requested.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRetryVersion]);
}

export function useGoalsSimulator(
  state: GoalsState,
  simulatorRetryVersion: number
) {
  const {
    selectedGoal,
    selectedOption,
    selectedGoalId,
    selectedDraft,
    setSimulation,
    setSimulatorError,
    setSimLoading,
  } = state;

  useEffect(() => {
    if (!selectedGoal || !selectedOption || !selectedGoalId || !selectedDraft) {
      setSimulation(null);
      setSimulatorError(null);
      return;
    }

    const goalId = selectedGoalId;
    const draft = selectedDraft;
    const option = selectedOption;
    let cancelled = false;

    async function runSimulator() {
      setSimLoading(true);
      setSimulatorError(null);
      try {
        const params = new URLSearchParams();
        params.set("goalId", goalId);
        params.set("bufferPoints", String(draft.bufferPoints));

        for (const weight of option.weights) {
          const testCode = normalizeTestCode(weight.testCode);
          params.set(testCode, draft.scores[testCode]?.trim() ?? "");
        }

        const payload = await simulateGoal(params.toString());
        if (!cancelled) {
          setSimulation(payload);
        }
      } catch (simError) {
        if (!cancelled) {
          setSimulatorError(
            simError instanceof Error
              ? simError.message
              : "No pudimos calcular la simulación"
          );
        }
      } finally {
        if (!cancelled) {
          setSimLoading(false);
        }
      }
    }

    const debounceTimer = setTimeout(runSimulator, 400);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [
    selectedGoal,
    selectedOption,
    selectedGoalId,
    selectedDraft,
    simulatorRetryVersion,
    setSimulation,
    setSimulatorError,
    setSimLoading,
  ]);
}
