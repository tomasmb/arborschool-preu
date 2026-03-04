"use client";

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
  const slotMutations = useGoalSlotMutations(state);
  const draftMutations = useGoalDraftMutations(state);
  const saveHandlers = useGoalSaveHandlers(state);

  useGoalsLoader(state);
  useGoalsSimulator(state);

  return {
    loading: state.loading,
    saving: state.saving,
    simLoading: state.simLoading,
    error: state.error,
    simulatorError: state.simulatorError,
    infoMessage: state.infoMessage,
    dataset: state.dataset,
    options: state.options,
    goals: state.goals,
    availableOptions: state.availableOptions,
    savedGoals: state.savedGoals,
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
  };
}
