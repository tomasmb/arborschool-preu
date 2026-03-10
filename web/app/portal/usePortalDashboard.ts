"use client";

import { useEffect, useState } from "react";
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
        if (!isMounted) {
          return;
        }

        setData(payload.data);
        trackAuthSuccessOnce({
          source: "dashboard",
          entryPoint: "/portal",
          journeyState: payload.data.journeyState,
        });
        trackStudentDashboardViewed(payload.data.status);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(toErrorMessage(loadError, "No pudimos cargar tu portal"));
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

  return { loading, error, data };
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
            getErrorMessage(payload, "No pudimos cargar tu siguiente paso")
          );
        }
        if (isMounted) {
          setNextActionData(payload.data);
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        console.error("[portal] next-action-load-failed", loadError);
        setNextActionError(
          "Algo falló al cargar tu siguiente paso. Prueba de nuevo en unos segundos."
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

export function usePortalDashboard(): DashboardViewModel {
  const { loading, error, data } = useDashboardPayload();
  const { nextActionLoading, nextActionError, nextActionData } =
    useNextActionPayload();

  return {
    loading,
    error,
    data,
    nextActionLoading,
    nextActionError,
    nextActionData,
  };
}
