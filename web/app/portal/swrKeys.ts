/**
 * Central registry of SWR cache keys used in the portal.
 * Import these when calling `mutate()` to invalidate caches
 * after mutations.
 */
export const SWR_KEYS = {
  dashboard: "/api/student/dashboard/m1",
  progress: "/api/student/progress",
  goals: "/api/student/goals",
  objectives: "/api/student/objectives",
  nextAction: "/api/student/next-action",
  profile: "/api/student/me",
  reminders: "/api/student/reminders/preferences",
} as const;
