"use client";

import { useCallback, useState } from "react";
import {
  useGoalsLoader,
  useGoalsSimulator,
  useGoalsState,
} from "./usePortalGoals.state";
import {
  useGoalDraftMutations,
  useGoalSaveHandlers,
  useGoalSlotMutations,
} from "./usePortalGoals.actions";

export function usePortalGoals() {
  const state = useGoalsState();
  const [simulatorRetryVersion, setSimulatorRetryVersion] = useState(0);
  const slotMutations = useGoalSlotMutations(state);
  const draftMutations = useGoalDraftMutations(state);
  const saveHandlers = useGoalSaveHandlers(state);

  const mutateGoals = useGoalsLoader(state);
  useGoalsSimulator(state, simulatorRetryVersion);

  const retryLoadGoals = useCallback(() => {
    void mutateGoals();
  }, [mutateGoals]);

  const retrySimulation = useCallback(() => {
    setSimulatorRetryVersion((current) => current + 1);
  }, []);

  return {
    isDirty: state.isDirty,
    loading: state.loading,
    saving: state.saving,
    simLoading: state.simLoading,
    loadError: state.loadError,
    error: state.error,
    simulatorError: state.simulatorError,
    infoMessage: state.infoMessage,
    dataset: state.dataset,
    options: state.options,
    goals: state.goals,
    savedGoals: state.savedGoals,
    journeyState: state.journeyState,
    selectedGoalId: state.selectedGoalId,
    selectedGoal: state.selectedGoal,
    selectedOption: state.selectedOption,
    selectedDraft: state.selectedDraft,
    simulation: state.simulation,
    planningProfile: state.planningProfile,
    planningOfferingId: state.planningOfferingId,
    setGoalOffering: slotMutations.setGoalOffering,
    addGoalSlot: slotMutations.addGoalSlot,
    removeGoalSlot: slotMutations.removeGoalSlot,
    updateDraftScore: draftMutations.updateDraftScore,
    updateDraftBuffer: draftMutations.updateDraftBuffer,
    setSelectedGoalId: state.setSelectedGoalId,
    setPlanningOfferingId: state.setPlanningOfferingId,
    updatePlanningProfile: slotMutations.updatePlanningProfile,
    handleSave: saveHandlers.handleSave,
    handlePlanningSave: saveHandlers.handlePlanningSave,
    retryLoadGoals,
    retrySimulation,
  };
}
