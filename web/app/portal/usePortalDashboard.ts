"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import {
  trackAuthSuccessOnce,
  trackStudentDashboardViewed,
} from "@/lib/analytics";
import type { DashboardPayload, DashboardViewModel } from "./types";
import { SWR_KEYS } from "./swrKeys";

export function usePortalDashboard(): DashboardViewModel {
  const { data, error, isLoading } =
    useSWR<DashboardPayload>(SWR_KEYS.dashboard);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (!data || trackedRef.current) return;
    trackedRef.current = true;
    trackAuthSuccessOnce({
      source: "dashboard",
      entryPoint: "/portal",
      journeyState: data.journeyState,
    });
    trackStudentDashboardViewed(data.status);
  }, [data]);

  return {
    loading: isLoading,
    error: error ? (error as Error).message : null,
    data: data ?? null,
  };
}
