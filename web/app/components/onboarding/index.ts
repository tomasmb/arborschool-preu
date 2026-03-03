/**
 * New onboarding components — guarded by NEXT_PUBLIC_NEW_ONBOARDING feature flag.
 *
 * Usage:
 *   const NEW_ONBOARDING = process.env.NEXT_PUBLIC_NEW_ONBOARDING === 'true'
 */

export { GoalAnchorScreen } from "./GoalAnchorScreen";
export { PlanPreviewScreen } from "./PlanPreviewScreen";
export { saveCareerGoal, getCareerGoal } from "./careers";
export type { CareerOption, CareerGoal } from "./careers";
