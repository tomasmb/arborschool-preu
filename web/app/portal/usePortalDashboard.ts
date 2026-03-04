"use client";

import { useEffect, useMemo, useState } from "react";
import {
  trackAuthSuccessOnce,
  trackStudentDashboardViewed,
} from "@/lib/analytics";
import type { NextActionPayload } from "./NextActionSection";
import { toErrorMessage } from "./errorUtils";
import { getErrorMessage } from "./formatters";
import type {
  ApiEnvelope,
  DashboardPayload,
  DashboardViewModel,
} from "./types";

function useDashboardPayload() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [weeklyMinutes, setWeeklyMinutes] = useState(360);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/student/dashboard/m1", {
          method: "GET",
          credentials: "include",
        });

        const payload =
          (await response.json()) as ApiEnvelope<DashboardPayload>;
        if (!response.ok || !payload.success) {
          throw new Error(getErrorMessage(payload, "No se pudo cargar portal"));
        }
        if (!isMounted) {
          return;
        }

        setData(payload.data);
        setWeeklyMinutes(payload.data.effort.model.recommendedWeeklyMinutes);
        trackAuthSuccessOnce({
          source: "dashboard",
          entryPoint: "/portal",
        });
        trackStudentDashboardViewed(payload.data.status);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(toErrorMessage(loadError, "No se pudo cargar portal"));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, error, data, weeklyMinutes, setWeeklyMinutes };
}

function useNextActionPayload() {
  const [nextActionLoading, setNextActionLoading] = useState(true);
  const [nextActionError, setNextActionError] = useState<string | null>(null);
  const [nextActionData, setNextActionData] =
    useState<NextActionPayload | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNextAction() {
      setNextActionLoading(true);
      setNextActionError(null);

      try {
        const response = await fetch("/api/student/next-action", {
          method: "GET",
          credentials: "include",
        });

        const payload =
          (await response.json()) as ApiEnvelope<NextActionPayload>;
        if (!response.ok || !payload.success) {
          throw new Error(
            getErrorMessage(payload, "No se pudo cargar siguiente acción")
          );
        }
        if (isMounted) {
          setNextActionData(payload.data);
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setNextActionError(
          toErrorMessage(loadError, "No se pudo cargar siguiente acción")
        );
      } finally {
        if (isMounted) {
          setNextActionLoading(false);
        }
      }
    }

    loadNextAction();
    return () => {
      isMounted = false;
    };
  }, []);

  return { nextActionLoading, nextActionError, nextActionData };
}

function useProjectedScore(
  data: DashboardPayload | null,
  weeklyMinutes: number
) {
  return useMemo(() => {
    if (!data || data.current.score === null) {
      return null;
    }
    const minutesPerPoint = data.effort.model.minutesPerPoint;
    if (minutesPerPoint === null || minutesPerPoint <= 0) {
      return null;
    }

    const totalMinutes = weeklyMinutes * data.effort.model.forecastWeeks;
    const projectedDelta = totalMinutes / minutesPerPoint;
    const projectedRaw = Math.round(data.current.score + projectedDelta);
    const cappedScore = Math.max(100, Math.min(1000, projectedRaw));

    if (data.prediction.max !== null) {
      return Math.min(cappedScore, data.prediction.max);
    }

    return cappedScore;
  }, [data, weeklyMinutes]);
}

export function usePortalDashboard(): DashboardViewModel {
  const { loading, error, data, weeklyMinutes, setWeeklyMinutes } =
    useDashboardPayload();
  const { nextActionLoading, nextActionError, nextActionData } =
    useNextActionPayload();
  const projectedScore = useProjectedScore(data, weeklyMinutes);

  return {
    loading,
    error,
    data,
    weeklyMinutes,
    setWeeklyMinutes,
    projectedScore,
    nextActionLoading,
    nextActionError,
    nextActionData,
  };
}
