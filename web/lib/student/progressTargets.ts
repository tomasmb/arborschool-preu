/**
 * Progress Targets — student-centric M1 objective + career context.
 *
 * Reads the student's own M1 target from studentScoreTargets and
 * computes career positioning context (how many bookmarked careers
 * the student qualifies for given their current targets).
 */

import {
  listStudentScoreTargets,
  listStudentProfileScores,
  listStudentCareerInterests,
  listActiveAdmissionsDataset,
  listAdmissionsOptions,
  getStudentPlanningProfile,
  getStudentTestHours,
} from "./goals.read";
import {
  computeInterestPositions,
  type CareerPositionResult,
} from "./careerPositioning";
import { EFFECTIVE_MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";

export type GoalMilestone = {
  goalId: string;
  label: string;
  careerName: string;
  universityName: string;
  isPrimary: boolean;
  neededM1Score: number | null;
  userM1Target: number | null;
  lastCutoff: number | null;
  bufferPoints: number;
  missingNonM1Tests: string[];
};

export type CareerPositioningSummary = {
  total: number;
  above: number;
  near: number;
  below: number;
  incomplete: number;
  positions: CareerPositionResult[];
};

export type ProgressTargets = {
  milestones: GoalMilestone[];
  primaryTargetM1: number | null;
  highestTargetM1: number | null;
  highestUserM1: number | null;
  defaultAtomsPerWeek: number | null;
  /** Student-centric: the student's own M1 target from scoreTargets. */
  studentM1Target: number | null;
  /** How many bookmarked careers the student qualifies for. */
  careerPositioning: CareerPositioningSummary | null;
};

const M1_TEST_CODE = "M1";

/**
 * Returns progress targets using the student-centric model:
 * - studentM1Target: the student's own M1 objective
 * - careerPositioning: summary of how their targets map to careers
 * - Legacy milestones kept for backward compatibility during migration
 */
export async function getProgressTargets(
  userId: string
): Promise<ProgressTargets> {
  const dataset = await listActiveAdmissionsDataset();
  const [planningProfile, m1Minutes] = await Promise.all([
    getStudentPlanningProfile(userId),
    getStudentTestHours(userId, M1_TEST_CODE),
  ]);

  const effectiveMinutes =
    m1Minutes ?? planningProfile?.weeklyMinutesTarget ?? null;
  const defaultAtomsPerWeek = effectiveMinutes
    ? Math.round(effectiveMinutes / EFFECTIVE_MINUTES_PER_ATOM)
    : null;

  // Load student-centric data
  const [scoreTargets, profileScores] = await Promise.all([
    listStudentScoreTargets(userId),
    listStudentProfileScores(userId),
  ]);

  const m1Target =
    scoreTargets.find((t) => t.testCode === M1_TEST_CODE)?.score ?? null;

  if (!dataset) {
    return {
      milestones: [],
      primaryTargetM1: m1Target,
      highestTargetM1: m1Target,
      highestUserM1: m1Target,
      defaultAtomsPerWeek,
      studentM1Target: m1Target,
      careerPositioning: null,
    };
  }

  const [options, careerInterests] = await Promise.all([
    listAdmissionsOptions(dataset.id),
    listStudentCareerInterests(userId),
  ]);

  const positions = computeInterestPositions(
    careerInterests,
    options,
    scoreTargets,
    profileScores
  );

  const careerPositioning: CareerPositioningSummary = {
    total: positions.length,
    above: positions.filter((p) => p.status === "above").length,
    near: positions.filter((p) => p.status === "near").length,
    below: positions.filter((p) => p.status === "below").length,
    incomplete: positions.filter((p) => p.status === "incomplete").length,
    positions,
  };

  // Build legacy milestones from career interests for backward compat
  const milestones: GoalMilestone[] = careerInterests.map((ci) => {
    const position = positions.find((p) => p.offeringId === ci.offeringId);
    return {
      goalId: ci.goalId,
      label: `${ci.careerName} — ${ci.universityName}`,
      careerName: ci.careerName,
      universityName: ci.universityName,
      isPrimary: ci.priority === 1,
      neededM1Score: null,
      userM1Target: m1Target,
      lastCutoff: position?.lastCutoff ?? ci.lastCutoff,
      bufferPoints: 0,
      missingNonM1Tests: position?.missingTests ?? [],
    };
  });

  return {
    milestones,
    primaryTargetM1: m1Target,
    highestTargetM1: m1Target,
    highestUserM1: m1Target,
    defaultAtomsPerWeek,
    studentM1Target: m1Target,
    careerPositioning,
  };
}
