import {
  getStudentPlanningProfile,
  listActiveAdmissionsDataset,
  listAdmissionsOptions,
  listStudentGoals,
} from "./goals.read";
import { replaceStudentGoals } from "./goals.write";
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
  getStudentPlanningProfile,
  replaceStudentGoals,
};

export async function getStudentGoalsView(userId: string) {
  const dataset = await listActiveAdmissionsDataset();
  const planningProfile = await getStudentPlanningProfile(userId);

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

export async function saveStudentGoalsView(
  userId: string,
  goals: StudentGoalInput[],
  planningProfile?: StudentPlanningProfileInput
) {
  await replaceStudentGoals(userId, goals, planningProfile);
  return getStudentGoalsView(userId);
}
