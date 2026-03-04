"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import {
  trackPlanningSavedMilestone,
  trackStudentGoalsSaved,
  trackStudentSimulatorInteraction,
} from "@/lib/analytics";
import { planningProfileToApi, saveGoals } from "./api";
import type { GoalDraft, PlanningProfileDraft } from "./types";
import { normalizeTestCode } from "./utils";
import { applyGoalsPayload, type GoalsState } from "./usePortalGoals.state";

export type SaveGoalPayload = {
  offeringId: string;
  priority: number;
  isPrimary: boolean;
  bufferPoints: number;
  bufferSource: "student";
  scores: { testCode: string; score: number; source: "student" }[];
};

export function useGoalSlotMutations(state: GoalsState) {
  const setGoalOffering = useCallback(
    (priority: number, offeringId: string) => {
      state.setGoals((current) =>
        current.map((goal) =>
          goal.priority === priority ? { ...goal, offeringId } : goal
        )
      );
    },
    [state]
  );

  const addGoalSlot = useCallback(() => {
    state.setGoals((current) => {
      if (current.length >= 3) {
        return current;
      }
      return [...current, { offeringId: "", priority: current.length + 1 }];
    });
  }, [state]);

  const removeGoalSlot = useCallback(
    (priority: number) => {
      state.setGoals((current) =>
        current
          .filter((goal) => goal.priority !== priority)
          .map((goal, index) => ({ ...goal, priority: index + 1 }))
      );
    },
    [state]
  );

  const updatePlanningProfile = useCallback(
    (patch: Partial<PlanningProfileDraft>) => {
      state.setPlanningProfile((current) => ({ ...current, ...patch }));
      state.setInfoMessage(null);
    },
    [state]
  );

  return {
    setGoalOffering,
    addGoalSlot,
    removeGoalSlot,
    updatePlanningProfile,
  };
}

export function useGoalDraftMutations(state: GoalsState) {
  const simulatorInteractionTracked = useRef(false);

  const updateGoalDraft = useCallback(
    (goalId: string, next: (draft: GoalDraft) => GoalDraft) => {
      state.setDrafts((current) => {
        const draft = current[goalId] ?? { bufferPoints: 30, scores: {} };
        return {
          ...current,
          [goalId]: next(draft),
        };
      });
    },
    [state]
  );

  const updateDraftScore = useCallback(
    (goalId: string, testCode: string, value: string) => {
      if (!simulatorInteractionTracked.current) {
        trackStudentSimulatorInteraction("score_input");
        simulatorInteractionTracked.current = true;
      }

      const normalized = normalizeTestCode(testCode);
      updateGoalDraft(goalId, (goalDraft) => ({
        ...goalDraft,
        scores: {
          ...goalDraft.scores,
          [normalized]: value,
        },
      }));
    },
    [updateGoalDraft]
  );

  const updateDraftBuffer = useCallback(
    (goalId: string, value: string) => {
      if (!simulatorInteractionTracked.current) {
        trackStudentSimulatorInteraction("buffer_change");
        simulatorInteractionTracked.current = true;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return;
      }

      updateGoalDraft(goalId, (goalDraft) => ({
        ...goalDraft,
        bufferPoints: Math.round(parsed),
      }));
    },
    [updateGoalDraft]
  );

  return {
    updateDraftScore,
    updateDraftBuffer,
  };
}

function validateBeforeSave(state: GoalsState): string | null {
  const filled = state.goals.filter((goal) => goal.offeringId !== "");
  if (filled.length === 0) {
    return "Selecciona al menos un objetivo";
  }

  const unique = new Set(filled.map((goal) => goal.offeringId));
  if (unique.size !== filled.length) {
    return "No puedes repetir la misma carrera/universidad";
  }

  for (const goal of state.savedGoals) {
    const draft = state.drafts[goal.id];
    if (!draft) {
      continue;
    }

    for (const [testCode, rawValue] of Object.entries(draft.scores)) {
      if (rawValue.trim().length === 0) {
        continue;
      }
      const score = Number(rawValue);
      if (!Number.isFinite(score) || score < 100 || score > 1000) {
        return `El puntaje ${testCode} debe estar entre 100 y 1000`;
      }
    }
  }

  return null;
}

function buildSavePayload(state: GoalsState): SaveGoalPayload[] {
  const filledGoals = state.goals.filter((goal) => goal.offeringId !== "");
  return filledGoals.map((goal) => {
    const existingGoal = state.savedGoals.find(
      (savedGoal) => savedGoal.offeringId === goal.offeringId
    );
    const draft = existingGoal ? state.drafts[existingGoal.id] : undefined;
    const option = state.optionByOffering.get(goal.offeringId);

    const scores = (option?.weights ?? [])
      .map((weight) => normalizeTestCode(weight.testCode))
      .map((testCode) => {
        const raw = draft?.scores[testCode]?.trim() ?? "";
        if (!raw) {
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
      isPrimary: goal.priority === 1,
      bufferPoints: draft?.bufferPoints ?? 30,
      bufferSource: "student",
      scores,
    };
  });
}

export function useGoalSaveHandlers(state: GoalsState) {
  const router = useRouter();
  const persistGoals = useCallback(
    async (payloadGoals: SaveGoalPayload[]) => {
      const planningProfilePayload = planningProfileToApi(
        state.planningProfile
      );
      const saved = await saveGoals({
        goals: payloadGoals,
        planningProfile: planningProfilePayload,
      });
      const mode = state.savedGoals.length === 0 ? "create" : "update";

      trackStudentGoalsSaved(
        mode,
        payloadGoals.length,
        payloadGoals.filter((goal) => goal.isPrimary).length
      );
      trackPlanningSavedMilestone({
        mode,
        goalCount: payloadGoals.length,
        entryPoint: "/portal/goals",
        journeyState: saved.journeyState,
      });
      applyGoalsPayload(state, saved);
    },
    [state]
  );

  const handleSave = useCallback(async () => {
    const validationError = validateBeforeSave(state);
    if (validationError) {
      state.setError(validationError);
      return;
    }
    state.setSaving(true);
    state.setError(null);
    state.setInfoMessage(null);
    try {
      await persistGoals(buildSavePayload(state));
      state.setInfoMessage("Objetivos guardados.");
    } catch (saveError) {
      state.setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar objetivos"
      );
    } finally {
      state.setSaving(false);
    }
  }, [persistGoals, state]);

  const handlePlanningSave = useCallback(
    async (redirectToDiagnostic: boolean) => {
      if (!state.planningOfferingId) {
        state.setError("Selecciona una carrera/universidad objetivo");
        return;
      }
      state.setSaving(true);
      state.setError(null);
      state.setInfoMessage(null);
      try {
        await persistGoals([
          {
            offeringId: state.planningOfferingId,
            priority: 1,
            isPrimary: true,
            bufferPoints: 30,
            bufferSource: "student",
            scores: [],
          },
        ]);

        if (redirectToDiagnostic) {
          router.push("/diagnostico");
          return;
        }

        state.setInfoMessage("Plan guardado. Puedes volver cuando quieras.");
      } catch (saveError) {
        state.setError(
          saveError instanceof Error
            ? saveError.message
            : "No se pudo guardar planificación"
        );
      } finally {
        state.setSaving(false);
      }
    },
    [persistGoals, router, state]
  );

  return {
    handleSave,
    handlePlanningSave,
  };
}
