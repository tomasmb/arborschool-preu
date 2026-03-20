"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import { QUESTIONS_PER_STAGE, type Route } from "@/lib/diagnostic/config";
import { trackTimeExpired } from "@/lib/analytics";
import type { DiagnosticResults } from "@/lib/diagnostic/resultsCalculator";
import { computeScoredResults } from "../utils/diagnosticApi";
import type { Screen } from "./useDiagnosticFlow.types";

type TimerParams = {
  isRestored: boolean;
  stage: 1 | 2;
  questionIndex: number;
  route: Route | null;
  screen: Screen;
  timeExpiredAt: number | null;
  timerRef: MutableRefObject<NodeJS.Timeout | null>;
  setTimeExpiredAt: (value: number | null) => void;
  setTimeRemaining: (value: number | ((prev: number) => number)) => void;
  setShowTimeUpModal: (value: boolean) => void;
  setScreen: (value: Screen) => void;
  setResults: (value: DiagnosticResults) => void;
  setConsistentScore: (value: number | null) => void;
};

export function useRouteRef(route: Route | null) {
  const routeRef = useRef(route);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  return routeRef;
}

export function useDiagnosticTimer(
  params: TimerParams,
  routeRef: MutableRefObject<Route | null>
) {
  const handleTimeUp = useCallback(() => {
    const stage1Answered =
      params.stage === 1 ? params.questionIndex : QUESTIONS_PER_STAGE;
    const stage2Answered = params.stage === 2 ? params.questionIndex : 0;
    trackTimeExpired(
      params.stage,
      params.questionIndex,
      stage1Answered + stage2Answered
    );

    params.setTimeExpiredAt(Date.now());
    params.setTimeRemaining(0);
    if (params.timerRef.current) {
      clearInterval(params.timerRef.current);
      params.timerRef.current = null;
    }
    params.setShowTimeUpModal(true);
  }, [params]);

  const handleContinueAfterTimeUp = useCallback(() => {
    params.setShowTimeUpModal(false);
  }, [params]);

  const handleViewResultsAfterTimeUp = useCallback(() => {
    params.setShowTimeUpModal(false);
    const currentRoute = routeRef.current;
    if (!currentRoute) {
      params.setScreen("maintenance");
      return;
    }

    const { calc, midScore } = computeScoredResults(currentRoute);
    params.setResults(calc);
    params.setConsistentScore(midScore);
    params.setScreen("partial-results");
  }, [params, routeRef]);

  useEffect(() => {
    if (!params.isRestored) return;
    if (params.timeExpiredAt !== null) {
      return;
    }

    if (params.screen === "question" && !params.timerRef.current) {
      params.timerRef.current = setInterval(() => {
        params.setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (params.timerRef.current) {
              clearInterval(params.timerRef.current);
            }
            params.timerRef.current = null;
            setTimeout(() => handleTimeUp(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (params.timerRef.current && params.screen !== "question") {
        clearInterval(params.timerRef.current);
        params.timerRef.current = null;
      }
    };
  }, [handleTimeUp, params]);

  return {
    handleTimeUp,
    handleContinueAfterTimeUp,
    handleViewResultsAfterTimeUp,
  };
}
