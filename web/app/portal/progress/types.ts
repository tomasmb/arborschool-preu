/** Mirrors API response types from GET /api/student/progress */

export type ScoreDataPoint = {
  date: string;
  type: "short_diagnostic" | "full_test";
  paesScoreMin: number;
  paesScoreMax: number;
  paesScoreMid: number;
  correctAnswers: number | null;
  totalQuestions: number | null;
  testName: string | null;
};

export type ProjectionPoint = {
  week: number;
  projectedScoreMid: number;
};

export type ProjectionResult = {
  points: ProjectionPoint[];
  weeksToTarget: number | null;
  targetScore: number | null;
  studyMinutesPerWeek: number;
};

export type RetestStatus = {
  atomsMasteredSinceLastTest: number;
  eligible: boolean;
  recommended: boolean;
  blockedReason: string | null;
  daysSinceLastTest: number | null;
};

export type MasteryBreakdown = {
  mastered: number;
  inProgress: number;
  needsVerification: number;
  notStarted: number;
  total: number;
};

export type AxisMasteryItem = {
  axis: string;
  axisCode: string;
  label: string;
  mastered: number;
  total: number;
};

export type ProgressData = {
  masteryBreakdown: MasteryBreakdown;
  axisMastery: AxisMasteryItem[];
  personalBest: number | null;
  scoreHistory: ScoreDataPoint[];
  projection: ProjectionResult;
  retestStatus: RetestStatus;
  currentScore: { min: number; max: number; mid: number } | null;
  targetScore: number | null;
};
