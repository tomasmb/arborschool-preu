/**
 * Progress Targets — computes M1 target scores from student career goals.
 *
 * For each active student goal, calculates the PAES M1 score needed
 * to reach the career's cutoff + buffer, given the student's scores
 * in non-M1 tests and the offering's weight distribution.
 */

import {
  listActiveAdmissionsDataset,
  listAdmissionsOptions,
  listStudentGoals,
  getStudentPlanningProfile,
} from "./goals.read";
import { MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";

export type GoalMilestone = {
  goalId: string;
  label: string;
  careerName: string;
  universityName: string;
  isPrimary: boolean;
  neededM1Score: number | null;
  lastCutoff: number | null;
  bufferPoints: number;
  missingNonM1Tests: string[];
};

export type ProgressTargets = {
  milestones: GoalMilestone[];
  primaryTargetM1: number | null;
  highestTargetM1: number | null;
  defaultAtomsPerWeek: number | null;
};

const M1_TEST_CODE = "M1";

function normalizeTestCode(testCode: string): string {
  return testCode.trim().toUpperCase();
}

/**
 * Computes the M1 PAES score needed for each student goal.
 *
 * Formula per goal:
 *   neededM1 = (cutoff + buffer - nonM1Contributions) / (m1Weight / 100)
 *
 * If any non-M1 test score is missing, neededM1Score is null for that goal.
 */
export async function getProgressTargets(
  userId: string
): Promise<ProgressTargets> {
  const dataset = await listActiveAdmissionsDataset();
  const planningProfile = await getStudentPlanningProfile(userId);

  const defaultAtomsPerWeek = planningProfile?.weeklyMinutesTarget
    ? Math.round(planningProfile.weeklyMinutesTarget / MINUTES_PER_ATOM)
    : null;

  if (!dataset) {
    return {
      milestones: [],
      primaryTargetM1: null,
      highestTargetM1: null,
      defaultAtomsPerWeek,
    };
  }

  const [options, goals] = await Promise.all([
    listAdmissionsOptions(dataset.id),
    listStudentGoals(userId),
  ]);

  const milestones: GoalMilestone[] = [];

  for (const goal of goals) {
    const option = options.find((o) => o.offeringId === goal.offeringId);
    if (!option) continue;

    const bufferPoints = goal.buffer.points;
    const bufferedTarget =
      goal.lastCutoff !== null ? goal.lastCutoff + bufferPoints : null;

    const m1Weight = option.weights.find(
      (w) => normalizeTestCode(w.testCode) === M1_TEST_CODE
    );

    if (!m1Weight || !bufferedTarget) {
      milestones.push({
        goalId: goal.id,
        label: `${option.careerName} — ${option.universityName}`,
        careerName: option.careerName,
        universityName: option.universityName,
        isPrimary: goal.isPrimary,
        neededM1Score: null,
        lastCutoff: goal.lastCutoff,
        bufferPoints,
        missingNonM1Tests: [],
      });
      continue;
    }

    const goalScores = new Map(
      goal.scores.map((s) => [normalizeTestCode(s.testCode), s.score])
    );

    let nonM1Sum = 0;
    const missingNonM1Tests: string[] = [];

    for (const weight of option.weights) {
      const testCode = normalizeTestCode(weight.testCode);
      if (testCode === M1_TEST_CODE) continue;

      const score = goalScores.get(testCode);
      if (score != null) {
        nonM1Sum += score * (weight.weightPercent / 100);
      } else {
        missingNonM1Tests.push(testCode);
      }
    }

    let neededM1Score: number | null = null;
    if (missingNonM1Tests.length === 0) {
      const m1Fraction = m1Weight.weightPercent / 100;
      const rawNeeded = (bufferedTarget - nonM1Sum) / m1Fraction;
      neededM1Score = Math.round(Math.max(100, Math.min(1000, rawNeeded)));
    }

    milestones.push({
      goalId: goal.id,
      label: `${option.careerName} — ${option.universityName}`,
      careerName: option.careerName,
      universityName: option.universityName,
      isPrimary: goal.isPrimary,
      neededM1Score,
      lastCutoff: goal.lastCutoff,
      bufferPoints,
      missingNonM1Tests,
    });
  }

  const primaryGoal = milestones.find((m) => m.isPrimary);
  const primaryTargetM1 = primaryGoal?.neededM1Score ?? null;

  const validTargets = milestones
    .filter((m) => m.neededM1Score !== null)
    .map((m) => m.neededM1Score!);
  const highestTargetM1 =
    validTargets.length > 0 ? Math.max(...validTargets) : null;

  return {
    milestones,
    primaryTargetM1,
    highestTargetM1,
    defaultAtomsPerWeek,
  };
}
