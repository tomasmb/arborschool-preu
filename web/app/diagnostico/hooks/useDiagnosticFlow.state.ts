"use client";

import { useRef, useState } from "react";
import { type Route } from "@/lib/diagnostic/config";
import { type DiagnosticResults } from "@/lib/diagnostic/resultsCalculator";
import { type ResponseForReview } from "@/lib/diagnostic/storage";
import { type TopRouteInfo } from "../components/ResultsScreen";
import { type LearningRoutesResponse } from "./useLearningRoutes";
import { type Screen } from "./useDiagnosticFlow.types";

export function useDiagnosticFlowCoreState() {
  const [screen, setScreen] = useState<Screen>("question");
  const [isStudentPortalUser, setIsStudentPortalUser] = useState(false);
  const [isInitializingStudentSession, setIsInitializingStudentSession] =
    useState(true);
  const [studentSessionChecked, setStudentSessionChecked] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isDontKnow, setIsDontKnow] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [consistentScore, setConsistentScore] = useState<number | null>(null);
  const [topRouteInfo, setTopRouteInfo] = useState<TopRouteInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  return {
    screen,
    setScreen,
    isStudentPortalUser,
    setIsStudentPortalUser,
    isInitializingStudentSession,
    setIsInitializingStudentSession,
    studentSessionChecked,
    setStudentSessionChecked,
    stage,
    setStage,
    questionIndex,
    setQuestionIndex,
    selectedAnswer,
    setSelectedAnswer,
    isDontKnow,
    setIsDontKnow,
    route,
    setRoute,
    results,
    setResults,
    consistentScore,
    setConsistentScore,
    topRouteInfo,
    setTopRouteInfo,
    userId,
    setUserId,
    profileSaved,
    setProfileSaved,
  };
}

export function useDiagnosticFlowCacheState() {
  const [cachedResponsesForReview, setCachedResponsesForReview] = useState<
    ResponseForReview[]
  >([]);
  const [cachedResults, setCachedResults] = useState<DiagnosticResults | null>(
    null
  );
  const [cachedAtomResults, setCachedAtomResults] = useState<
    { atomId: string; mastered: boolean }[]
  >([]);
  const [cachedScoredCorrect, setCachedScoredCorrect] = useState<number>(0);
  const [cachedActualRoute, setCachedActualRoute] = useState<Route | null>(
    null
  );
  const [routesData, setRoutesData] = useState<LearningRoutesResponse | null>(
    null
  );
  const [routesLoading, setRoutesLoading] = useState(false);
  const [cachedRoutesData, setCachedRoutesData] =
    useState<LearningRoutesResponse | null>(null);

  return {
    cachedResponsesForReview,
    setCachedResponsesForReview,
    cachedResults,
    setCachedResults,
    cachedAtomResults,
    setCachedAtomResults,
    cachedScoredCorrect,
    setCachedScoredCorrect,
    cachedActualRoute,
    setCachedActualRoute,
    routesData,
    setRoutesData,
    routesLoading,
    setRoutesLoading,
    cachedRoutesData,
    setCachedRoutesData,
  };
}

export function useDiagnosticFlowTimerState() {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timeExpiredAt, setTimeExpiredAt] = useState<number | null>(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  return {
    attemptId,
    setAttemptId,
    timeRemaining,
    setTimeRemaining,
    timerStartedAt,
    setTimerStartedAt,
    timeExpiredAt,
    setTimeExpiredAt,
    showTimeUpModal,
    setShowTimeUpModal,
    timerRef,
    questionStartTime,
  };
}
