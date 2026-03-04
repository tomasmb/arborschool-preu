import type {
  GoalDraft,
  GoalRecord,
  PlanningProfileDraft,
  SimulatorPayload,
  StudentGoal,
  StudentGoalsPayload,
} from "./types";

export type SaveGoalPayload = {
  offeringId: string;
  priority: number;
  isPrimary: boolean;
  bufferPoints: number;
  bufferSource: "student";
  scores: { testCode: string; score: number; source: "student" }[];
};

export type PortalGoalsState = {
  loading: boolean;
  setLoading: (value: boolean) => void;
  saving: boolean;
  setSaving: (value: boolean) => void;
  simLoading: boolean;
  setSimLoading: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
  simulatorError: string | null;
  setSimulatorError: (value: string | null) => void;
  infoMessage: string | null;
  setInfoMessage: (value: string | null) => void;
  dataset: StudentGoalsPayload["dataset"];
  options: StudentGoalsPayload["options"];
  goals: GoalRecord[];
  availableOptions: { offeringId: string; label: string }[];
  savedGoals: StudentGoal[];
  selectedGoalId: string | null;
  selectedGoal: StudentGoal | null;
  selectedOption: StudentGoalsPayload["options"][number] | null;
  selectedDraft: GoalDraft | null;
  simulation: SimulatorPayload | null;
  planningProfile: PlanningProfileDraft;
  planningOfferingId: string;
  drafts: Record<string, GoalDraft>;
  optionByOffering: Map<string, StudentGoalsPayload["options"][number]>;
  applyPayload: (data: StudentGoalsPayload) => void;
  setGoalOffering: (priority: number, offeringId: string) => void;
  addGoalSlot: () => void;
  removeGoalSlot: (priority: number) => void;
  setSelectedGoalId: (goalId: string) => void;
  setPlanningOfferingId: (offeringId: string) => void;
  updatePlanningProfile: (patch: Partial<PlanningProfileDraft>) => void;
  updateDraftScore: (goalId: string, testCode: string, value: string) => void;
  updateDraftBuffer: (goalId: string, value: string) => void;
  setSimulation: (value: SimulatorPayload | null) => void;
};
