export type GoalOption = {
  offeringId: string;
  careerName: string;
  universityName: string;
  lastCutoff: number | null;
  cutoffYear: number | null;
  weights: { testCode: string; weightPercent: number }[];
};

export type StudentGoal = {
  id: string;
  offeringId: string;
  priority: number;
  isPrimary: boolean;
  careerName: string;
  universityName: string;
  lastCutoff: number | null;
  cutoffYear: number | null;
  buffer: {
    points: number;
    source: string;
    isStudentEntered: boolean;
  };
  scores: {
    testCode: string;
    score: number;
    source: string;
    isStudentEntered: boolean;
  }[];
};

export type GoalRecord = {
  id?: string;
  offeringId: string;
  priority: number;
};

export type GoalDraft = {
  bufferPoints: number;
  scores: Record<string, string>;
};

export type StudentGoalsPayload = {
  dataset: {
    id: string;
    version: string;
    source: string;
    publishedAt: string;
  } | null;
  options: GoalOption[];
  goals: StudentGoal[];
  journeyState:
    | "planning_required"
    | "diagnostic_in_progress"
    | "activation_ready"
    | "active_learning";
  planningProfile: {
    examDate: string | null;
    weeklyMinutesTarget: number;
    timezone: string;
    reminderInApp: boolean;
    reminderEmail: boolean;
    updatedAt: string | Date;
  } | null;
};

export type PlanningProfileDraft = {
  examDate: string;
  weeklyMinutesTarget: string;
  reminderInApp: boolean;
  reminderEmail: boolean;
};

export type SimulatorPayload = {
  goalId: string;
  offeringLabel: string;
  formula: {
    components: {
      testCode: string;
      weightPercent: number;
      score: number | null;
      scoreSource: "student" | "system" | "query" | null;
      contribution: number | null;
    }[];
    weightedScore: number | null;
    missingTests: string[];
    isComplete: boolean;
  };
  targets: {
    lastCutoff: number | null;
    cutoffYear: number | null;
    bufferedTarget: number | null;
  };
  admissibility: {
    deltaVsBufferedTarget: number | null;
    deltaVsLastCutoff: number | null;
    meetsBufferedTarget: boolean | null;
  };
  sensitivity: {
    testCode: string;
    increment: number;
    adjustedWeightedScore: number | null;
    weightedDelta: number | null;
    deltaVsBufferedTarget: number | null;
    deltaVsLastCutoff: number | null;
  };
};

export const MAX_PRIMARY_GOALS = 3;
