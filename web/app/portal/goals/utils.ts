import { GoalDraft, GoalOption, StudentGoal } from "./types";

export function normalizeTestCode(testCode: string): string {
  return testCode.trim().toUpperCase();
}

export function formatNumber(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toDraft(goal: StudentGoal, option?: GoalOption): GoalDraft {
  const tests =
    option?.weights.map((weight) => normalizeTestCode(weight.testCode)) ?? [];
  const scores: Record<string, string> = {};

  for (const testCode of tests) {
    const existing = goal.scores.find(
      (score) => normalizeTestCode(score.testCode) === testCode
    );
    scores[testCode] = existing ? String(existing.score) : "";
  }

  return {
    bufferPoints: goal.buffer.points,
    scores,
  };
}
