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

export type UnlockCurveEntry = {
  atomsMastered: number;
  questionsUnlocked: number;
};

/** Server-computed metadata the client uses to build projections locally. */
export type ProjectionMetadata = {
  unlockCurve: UnlockCurveEntry[];
  accuracyUncertainty: number;
  effectiveMinPerAtom: number;
  totalRemainingAtoms: number;
  /** Total official questions in the pool; used for normalization to 60. */
  totalOfficialQuestions: number;
  currentScore: number;
  targetScore: number | null;
};

export type GoalMilestone = {
  goalId: string;
  label: string;
  careerName: string;
  universityName: string;
  isPrimary: boolean;
  neededM1Score: number | null;
  userM1Target: number | null;
  weeksToReach: number | null;
  lastCutoff: number | null;
  bufferPoints: number;
  missingNonM1Tests: string[];
};

export type RetestStatus = {
  atomsMasteredSinceLastTest: number;
  eligible: boolean;
  recommended: boolean;
  blockedReason: string | null;
  daysSinceLastTest: number | null;
  isFirstTest: boolean;
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

export type CurrentScore = {
  min: number;
  max: number;
  mid: number;
  isPersonalBest: boolean;
};

export type ProgressData = {
  masteryBreakdown: MasteryBreakdown;
  axisMastery: AxisMasteryItem[];
  personalBest: number | null;
  scoreHistory: ScoreDataPoint[];
  projectionMetadata: ProjectionMetadata | null;
  retestStatus: RetestStatus;
  currentScore: CurrentScore | null;
  goalMilestones: GoalMilestone[];
  defaultAtomsPerWeek: number | null;
};
