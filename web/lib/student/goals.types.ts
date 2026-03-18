export const MAX_PRIMARY_GOALS = 3;

type GoalScoreInput = {
  testCode: string;
  score: number;
  source?: "student" | "system";
};

export type StudentPlanningProfileInput = {
  examDate?: string | null;
  weeklyMinutesTarget?: number;
  timezone?: string;
  reminderInApp?: boolean;
  reminderEmail?: boolean;
};

export type StudentGoalInput = {
  offeringId: string;
  priority: number;
  isPrimary?: boolean;
  bufferPoints?: number;
  bufferSource?: "student" | "system";
  scores?: GoalScoreInput[];
};

export type NormalizedPlanningProfile = {
  examDate: string | null;
  weeklyMinutesTarget: number;
  timezone: string;
  reminderInApp: boolean;
  reminderEmail: boolean;
};

export function normalizePlanningProfileInput(
  profile: StudentPlanningProfileInput | undefined
): NormalizedPlanningProfile | null {
  if (!profile) {
    return null;
  }

  const normalizedTimezone =
    typeof profile.timezone === "string" && profile.timezone.trim().length > 0
      ? profile.timezone.trim()
      : "America/Santiago";

  let normalizedWeeklyMinutesTarget = 360;
  if (profile.weeklyMinutesTarget !== undefined) {
    if (
      !Number.isInteger(profile.weeklyMinutesTarget) ||
      profile.weeklyMinutesTarget < 30 ||
      profile.weeklyMinutesTarget > 600
    ) {
      throw new Error(
        "weeklyMinutesTarget must be an integer between 30 and 600"
      );
    }
    normalizedWeeklyMinutesTarget = profile.weeklyMinutesTarget;
  }

  let normalizedExamDate: string | null = null;
  if (profile.examDate !== undefined && profile.examDate !== null) {
    const dateValue = profile.examDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      throw new Error("examDate must use YYYY-MM-DD format");
    }
    normalizedExamDate = dateValue;
  }

  return {
    examDate: normalizedExamDate,
    weeklyMinutesTarget: normalizedWeeklyMinutesTarget,
    timezone: normalizedTimezone,
    reminderInApp: profile.reminderInApp ?? true,
    reminderEmail: profile.reminderEmail ?? true,
  };
}

export function normalizeScore(value: number): string {
  return Math.round(value).toFixed(2);
}

export function normalizeWeightOrScore(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateGoalInputs(goals: StudentGoalInput[]): string | null {
  if (!Array.isArray(goals) || goals.length === 0) {
    return "At least one goal is required";
  }

  const primaryCount = goals.filter((goal) => goal.isPrimary !== false).length;
  if (primaryCount > MAX_PRIMARY_GOALS) {
    return `A maximum of ${MAX_PRIMARY_GOALS} primary goals is allowed`;
  }

  const uniqueOfferingIds = new Set(goals.map((goal) => goal.offeringId));
  if (uniqueOfferingIds.size !== goals.length) {
    return "Duplicate goal offering ids are not allowed";
  }

  for (const goal of goals) {
    if (!goal.offeringId || typeof goal.offeringId !== "string") {
      return "Each goal must include a valid offeringId";
    }

    if (!Number.isInteger(goal.priority) || goal.priority < 1) {
      return "Each goal must include a positive integer priority";
    }

    if (
      goal.bufferPoints !== undefined &&
      (!Number.isInteger(goal.bufferPoints) || goal.bufferPoints < 0)
    ) {
      return "bufferPoints must be a non-negative integer";
    }

    for (const score of goal.scores ?? []) {
      if (!score.testCode || typeof score.testCode !== "string") {
        return "Each score requires a testCode";
      }
      if (!Number.isInteger(score.score)) {
        return "Scores must be whole numbers (no decimals)";
      }
      if (score.score < 100 || score.score > 1000) {
        return "Scores must be between 100 and 1000";
      }
    }
  }

  return null;
}
