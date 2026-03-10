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
  projectedScoreMin: number;
  projectedScoreMax: number;
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

export type ProgressData = {
  scoreHistory: ScoreDataPoint[];
  projection: ProjectionResult;
  retestStatus: RetestStatus;
  currentScore: { min: number; max: number; mid: number } | null;
  targetScore: number | null;
};
