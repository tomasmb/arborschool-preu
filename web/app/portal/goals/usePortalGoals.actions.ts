"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import {
  trackPlanningSavedMilestone,
  trackStudentGoalsSaved,
  trackStudentSimulatorInteraction,
} from "@/lib/analytics";
import { planningProfileToApi, saveGoals } from "./api";
import type { GoalDraft, PlanningProfileDraft, StudentGoal } from "./types";
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

      if (value === "") {
        updateGoalDraft(goalId, (d) => ({ ...d, bufferPoints: 0 }));
        return;
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
      if (!Number.isFinite(score) || !Number.isInteger(score)) {
        return `El puntaje ${testCode} debe ser un número entero`;
      }
      if (score < 100 || score > 1000) {
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
          score: Math.round(Number(raw)),
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

function readDraftScores(draft: GoalDraft | undefined) {
  if (!draft) {
    return [];
  }

  return Object.entries(draft.scores)
    .map(([testCode, rawValue]) => {
      const parsed = Math.round(Number(rawValue.trim()));
      if (!Number.isFinite(parsed) || parsed < 100 || parsed > 1000) {
        return null;
      }

      return {
        testCode: normalizeTestCode(testCode),
        score: parsed,
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
}

function hasStudentEnteredScores(
  goal: StudentGoal | undefined,
  draft: GoalDraft | undefined
) {
  if (readDraftScores(draft).length > 0) {
    return true;
  }

  return (goal?.scores ?? []).some((score) => score.isStudentEntered);
}

function buildPlanningSavePayload(state: GoalsState): SaveGoalPayload {
  const selectedGoal = state.savedGoals.find(
    (goal) => goal.offeringId === state.planningOfferingId
  );
  const selectedDraft = selectedGoal
    ? state.drafts[selectedGoal.id]
    : undefined;
  const draftScores = readDraftScores(selectedDraft);

  const preservedScores =
    draftScores.length > 0
      ? draftScores
      : (selectedGoal?.scores ?? [])
          .filter((score) => score.isStudentEntered)
          .map((score) => ({
            testCode: normalizeTestCode(score.testCode),
            score: score.score,
            source: "student" as const,
          }));

  return {
    offeringId: state.planningOfferingId,
    priority: 1,
    isPrimary: true,
    bufferPoints:
      selectedDraft?.bufferPoints ?? selectedGoal?.buffer.points ?? 30,
    bufferSource: "student",
    scores: preservedScores,
  };
}

function shouldAbortPlanningPrimaryGoalSwitch(state: GoalsState) {
  const primaryGoal = state.savedGoals.find((goal) => goal.priority === 1);
  const primaryDraft = primaryGoal ? state.drafts[primaryGoal.id] : undefined;
  const switchingPrimaryGoal =
    primaryGoal && primaryGoal.offeringId !== state.planningOfferingId;

  if (
    !switchingPrimaryGoal ||
    !hasStudentEnteredScores(primaryGoal, primaryDraft)
  ) {
    return false;
  }

  const confirmed = window.confirm(
    "Cambiar esta meta puede borrar puntajes que ya ingresaste. ¿Quieres continuar?"
  );

  if (confirmed) {
    return false;
  }

  state.setError(
    "Mantuvimos tu meta actual para no perder puntajes ingresados."
  );
  return true;
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
          : "No pudimos guardar tus metas"
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

      if (shouldAbortPlanningPrimaryGoalSwitch(state)) {
        return;
      }

      state.setSaving(true);
      state.setError(null);
      state.setInfoMessage(null);
      try {
        await persistGoals([buildPlanningSavePayload(state)]);

        if (redirectToDiagnostic) {
          router.push("/diagnostico");
          return;
        }

        state.setInfoMessage("Plan guardado. Puedes volver cuando quieras.");
        router.push("/portal");
      } catch (saveError) {
        state.setError(
          saveError instanceof Error
            ? saveError.message
            : "No pudimos guardar tu plan"
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
