"use client";

import { useEffect, useState } from "react";
import {
  trackAuthSuccessOnce,
  trackStudentDashboardViewed,
} from "@/lib/analytics";
import { toErrorMessage } from "./errorUtils";
import { getErrorMessage } from "./formatters";
import type {
  ApiEnvelope,
  DashboardPayload,
  DashboardViewModel,
} from "./types";

export function usePortalDashboard(): DashboardViewModel {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);

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
          throw new Error(
            getErrorMessage(payload, "No pudimos cargar tu portal")
          );
        }
        if (!isMounted) return;

        setData(payload.data);
        trackAuthSuccessOnce({
          source: "dashboard",
          entryPoint: "/portal",
          journeyState: payload.data.journeyState,
        });
        trackStudentDashboardViewed(payload.data.status);
      } catch (loadError) {
        if (!isMounted) return;
        setError(toErrorMessage(loadError, "No pudimos cargar tu portal"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, error, data };
}
