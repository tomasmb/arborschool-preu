import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";
import type { NextActionPayload } from "./NextActionSection";

export type { ApiEnvelope };

export type RetestStatusPayload = {
  atomsMasteredSinceLastTest: number;
  eligible: boolean;
  recommended: boolean;
  blockedReason: string | null;
  daysSinceLastTest: number | null;
  isFirstTest: boolean;
};

export type StreakPayload = {
  currentStreak: number;
  maxStreak: number;
};

export type DashboardPayload = {
  status: "ready" | "missing_diagnostic" | "missing_target" | "missing_mastery";
  journeyState:
    | "planning_required"
    | "diagnostic_in_progress"
    | "activation_ready"
    | "active_learning";
  current: {
    score: number | null;
    min: number | null;
    max: number | null;
    isPersonalBest: boolean;
  };
  target: {
    score: number | null;
    gapPoints: number | null;
    goalLabel: string | null;
  };
  prediction: {
    min: number | null;
    max: number | null;
  };
  confidence: {
    level: "low" | "medium" | "high";
    score: number;
    bandWidth: number | null;
    masteredAtoms: number;
    totalAtoms: number;
    masteryPercentage: number;
    questionsUnlocked: number;
    totalOfficialQuestions: number;
  };
  effort: {
    estimatedMinutesToTarget: number | null;
    topRoute: {
      axis: string;
      pointsGain: number;
      studyMinutes: number;
    } | null;
    model: {
      forecastWeeks: number;
      recommendedWeeklyMinutes: number;
      minutesPerPoint: number | null;
      minutesPerTenPoints: number | null;
    };
  };
  diagnosticSource: "short_diagnostic" | "full_test";
  retestStatus: RetestStatusPayload | null;
  mission: {
    id: string;
    weekStartDate: string;
    weekEndDate: string;
    targetSessions: number;
    completedSessions: number;
    status: string;
  };
  streak: StreakPayload;
  nextActionSummary: {
    status: "ready" | "missing_diagnostic" | "missing_mastery";
    hasAction: boolean;
    estimatedMinutes: number | null;
    pointsGain: number | null;
  };
  emptyState: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
};

export type DashboardViewModel = {
  loading: boolean;
  error: string | null;
  data: DashboardPayload | null;
  nextActionLoading: boolean;
  nextActionError: string | null;
  nextActionData: NextActionPayload | null;
};
