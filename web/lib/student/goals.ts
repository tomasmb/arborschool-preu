import {
  getStudentPlanningProfile,
  listActiveAdmissionsDataset,
  listAdmissionsOptions,
  listStudentGoals,
  listStudentScoreTargets,
  listStudentProfileScores,
  listStudentCareerInterests,
} from "./goals.read";
import {
  replaceStudentGoals,
  upsertStudentScoreTarget,
} from "./goals.write";
import {
  MAX_PRIMARY_GOALS,
  type StudentGoalInput,
  type StudentPlanningProfileInput,
} from "./goals.types";

export { MAX_PRIMARY_GOALS };
export type { StudentGoalInput, StudentPlanningProfileInput };

export {
  listActiveAdmissionsDataset,
  listAdmissionsOptions,
  listStudentGoals,
  listStudentScoreTargets,
  listStudentProfileScores,
  listStudentCareerInterests,
  getStudentPlanningProfile,
  replaceStudentGoals,
  upsertStudentScoreTarget,
};

/** Legacy view used by old career-centric goals page. */
export async function getStudentGoalsView(userId: string) {
  const [dataset, planningProfile] = await Promise.all([
    listActiveAdmissionsDataset(),
    getStudentPlanningProfile(userId),
  ]);

  if (!dataset) {
    return {
      dataset: null,
      options: [],
      goals: [],
      planningProfile,
    };
  }

  const [options, goals] = await Promise.all([
    listAdmissionsOptions(dataset.id),
    listStudentGoals(userId),
  ]);

  return {
    dataset: {
      id: dataset.id,
      version: dataset.version,
      source: dataset.source,
      publishedAt: dataset.publishedAt,
    },
    options,
    goals,
    planningProfile,
  };
}

/** Legacy save used by old career-centric goals page. */
export async function saveStudentGoalsView(
  userId: string,
  goals: StudentGoalInput[],
  planningProfile?: StudentPlanningProfileInput
) {
  await replaceStudentGoals(userId, goals, planningProfile);
  return getStudentGoalsView(userId);
}

/**
 * Student-centric objectives view: score targets, profile scores,
 * career interests, and admissions options for the positioning engine.
 */
export async function getStudentObjectivesView(userId: string) {
  const [dataset, planningProfile, scoreTargets, profileScores] =
    await Promise.all([
      listActiveAdmissionsDataset(),
      getStudentPlanningProfile(userId),
      listStudentScoreTargets(userId),
      listStudentProfileScores(userId),
    ]);

  if (!dataset) {
    return {
      dataset: null,
      options: [],
      scoreTargets,
      profileScores,
      careerInterests: [],
      planningProfile,
    };
  }

  const [options, careerInterests] = await Promise.all([
    listAdmissionsOptions(dataset.id),
    listStudentCareerInterests(userId),
  ]);

  return {
    dataset: {
      id: dataset.id,
      version: dataset.version,
      source: dataset.source,
      publishedAt: dataset.publishedAt,
    },
    options,
    scoreTargets,
    profileScores,
    careerInterests,
    planningProfile,
  };
}
