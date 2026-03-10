"use client";

import { useEffect } from "react";
import {
  trackAuthSuccessOnce,
  trackDiagnosticIntroViewed,
} from "@/lib/analytics";
import { buildSignInUrlWithCallback } from "@/lib/auth/callbackUrl";
import type { Screen } from "./useDiagnosticFlow.types";

export function useDiagnosticIntroTracking(params: {
  screen: Screen;
  studentSessionChecked: boolean;
  isStudentPortalUser: boolean;
}) {
  useEffect(() => {
    if (
      params.studentSessionChecked &&
      params.isStudentPortalUser &&
      params.screen === "question"
    ) {
      trackDiagnosticIntroViewed();
    }
  }, [params.screen, params.studentSessionChecked, params.isStudentPortalUser]);
}

export function useDiagnosticStudentBootstrap(params: {
  setIsStudentPortalUser: (value: boolean) => void;
  setUserId: (value: string | null) => void;
  setStudentSessionChecked: (value: boolean) => void;
  setIsInitializingStudentSession: (value: boolean) => void;
  startTest: () => Promise<void>;
}) {
  useEffect(() => {
    let cancelled = false;
    const signInUrl = buildSignInUrlWithCallback(
      `${window.location.pathname}${window.location.search}`
    );

    async function bootstrapStudentSession() {
      try {
        const response = await fetch("/api/student/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) {
            window.location.href = signInUrl;
          }
          return;
        }

        const payload = (await response.json()) as {
          success: boolean;
          data?: {
            id?: string;
            journeyState:
              | "planning_required"
              | "diagnostic_in_progress"
              | "activation_ready"
              | "active_learning";
          };
        };

        if (!payload.success || !payload.data?.id || cancelled) {
          if (!cancelled) {
            window.location.href = signInUrl;
          }
          return;
        }

        params.setIsStudentPortalUser(true);
        params.setUserId(payload.data.id);
        trackAuthSuccessOnce({
          source: "student_me",
          entryPoint: "/diagnostico",
          journeyState: payload.data.journeyState,
        });
        await params.startTest();
      } catch {
        if (!cancelled) {
          window.location.href = signInUrl;
        }
      } finally {
        if (!cancelled) {
          params.setStudentSessionChecked(true);
          params.setIsInitializingStudentSession(false);
        }
      }
    }

    void bootstrapStudentSession();

    return () => {
      cancelled = true;
    };
    // startTest intentionally excluded to keep one bootstrap cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useDiagnosticScrollToTop(params: {
  screen: Screen;
  questionIndex: number;
  stage: 1 | 2;
}) {
  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [params.screen, params.questionIndex, params.stage]);
}
