"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useLearningRoutes,
  sortRoutesByImpact,
} from "../hooks/useLearningRoutes";
import {
  getPerformanceTier,
  isLowSignalTier,
  getNextConceptsConfig,
} from "@/lib/config";
import { trackResultsViewed, trackRouteExplored } from "@/lib/analytics";
import { shouldShowRoutes, getScoreEmphasis } from "./TierContent";
import {
  buildNextConceptsFromResponses,
  type ResultsScreenProps,
} from "../utils";
import { ResultsScreenView } from "./ResultsScreenView";

export type { AtomResult, TopRouteInfo } from "../utils";

const CTA_LABEL = "Crear mi plan y empezar diagnóstico";
const EXPECTATION_LINE =
  "Inicias sesión, defines tu meta y arrancas tu primer sprint dentro del portal.";

type PerformanceTier = ReturnType<typeof getPerformanceTier>;

function useTopRouteSync(params: {
  onTopRouteCalculated: ResultsScreenProps["onTopRouteCalculated"];
  routesLoading: boolean;
  sortedRoutes: ReturnType<typeof sortRoutesByImpact>;
}) {
  const { onTopRouteCalculated, routesLoading, sortedRoutes } = params;

  useEffect(() => {
    if (!onTopRouteCalculated || routesLoading) {
      return;
    }

    if (sortedRoutes.length === 0) {
      onTopRouteCalculated(null);
      return;
    }

    onTopRouteCalculated({
      name: sortedRoutes[0].axis,
      questionsUnlocked: sortedRoutes[0].questionsUnlocked,
      pointsGain: sortedRoutes[0].pointsGain,
      studyHours: sortedRoutes[0].studyHours,
    });
  }, [onTopRouteCalculated, routesLoading, sortedRoutes]);
}

function useResponsesForReview(responses: ResultsScreenProps["responses"]) {
  return useMemo(
    () =>
      (responses ?? []).map((response) => ({
        question: response.question,
        selectedAnswer: response.selectedAnswer,
        isCorrect: response.isCorrect,
      })),
    [responses]
  );
}

function useResultsDerivedData(params: {
  totalCorrect: number;
  results: ResultsScreenProps["results"];
  atomResults: ResultsScreenProps["atomResults"];
  responses: ResultsScreenProps["responses"];
  precomputedRoutes: ResultsScreenProps["precomputedRoutes"];
  precomputedNextConcepts: ResultsScreenProps["precomputedNextConcepts"];
  onScoreCalculated: ResultsScreenProps["onScoreCalculated"];
  onTopRouteCalculated: ResultsScreenProps["onTopRouteCalculated"];
}) {
  const {
    totalCorrect,
    results,
    atomResults,
    responses,
    precomputedRoutes,
    precomputedNextConcepts,
    onScoreCalculated,
    onTopRouteCalculated,
  } = params;

  const performanceTier = useMemo(
    () => getPerformanceTier(totalCorrect),
    [totalCorrect]
  );
  const isLowSignal = useMemo(
    () => isLowSignalTier(performanceTier),
    [performanceTier]
  );
  const responsesForReview = useResponsesForReview(responses);

  const midScore = Math.round((results.paesMin + results.paesMax) / 2);
  const scoreMin = results.paesMin;
  const scoreMax = results.paesMax;
  const scoreEmphasis = getScoreEmphasis(performanceTier);

  const liveRoutes = useLearningRoutes(atomResults ?? [], midScore, {
    skip: !!precomputedRoutes,
  });
  const routesData = precomputedRoutes ?? liveRoutes.data;
  const routesLoading = precomputedRoutes ? false : liveRoutes.isLoading;

  useEffect(() => {
    onScoreCalculated?.(midScore);
  }, [midScore, onScoreCalculated]);

  const sortedRoutes = useMemo(
    () => (routesData?.routes ? sortRoutesByImpact(routesData.routes) : []),
    [routesData?.routes]
  );

  useTopRouteSync({ onTopRouteCalculated, routesLoading, sortedRoutes });

  const { potentialImprovement, studyHours } = useMemo(() => {
    if (!sortedRoutes.length) {
      return { potentialImprovement: 0, studyHours: 0 };
    }

    return {
      potentialImprovement: sortedRoutes[0].pointsGain,
      studyHours: sortedRoutes[0].studyHours,
    };
  }, [sortedRoutes]);

  const nextConcepts = useMemo(() => {
    if (precomputedNextConcepts) {
      return precomputedNextConcepts;
    }

    const recommendedRoute = sortedRoutes.length ? sortedRoutes[0] : null;
    return buildNextConceptsFromResponses(responses ?? [], recommendedRoute);
  }, [responses, sortedRoutes, precomputedNextConcepts]);

  const nextConceptsConfig = useMemo(
    () => getNextConceptsConfig(performanceTier),
    [performanceTier]
  );

  return {
    performanceTier,
    isLowSignal,
    responsesForReview,
    midScore,
    scoreMin,
    scoreMax,
    scoreEmphasis,
    routesData,
    routesLoading,
    potentialImprovement,
    studyHours,
    nextConcepts,
    showNextConcepts:
      nextConceptsConfig.showPersonalized ||
      nextConceptsConfig.showGenericLadder,
    showRoutes: shouldShowRoutes(performanceTier),
    sortedRoutes,
  };
}

function useResultsUiState(params: {
  results: ResultsScreenProps["results"];
  route: ResultsScreenProps["route"];
  totalCorrect: number;
  performanceTier: PerformanceTier;
}) {
  const [showContent, setShowContent] = useState(false);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;
    trackResultsViewed(
      params.results.paesMin,
      params.results.paesMax,
      params.performanceTier,
      params.totalCorrect,
      params.route
    );
  }, [
    params.results,
    params.performanceTier,
    params.totalCorrect,
    params.route,
  ]);

  const toggleRoutes = () => {
    setShowMoreDetails((current) => {
      if (!current) {
        trackRouteExplored(params.performanceTier, params.route);
      }
      return !current;
    });
  };

  return {
    showContent,
    showReviewDrawer,
    showMoreDetails,
    openReviewDrawer: () => setShowReviewDrawer(true),
    closeReviewDrawer: () => setShowReviewDrawer(false),
    toggleRoutes,
  };
}

export function ResultsScreen({
  results,
  route,
  totalCorrect,
  atomResults = [],
  responses = [],
  onSignup,
  onScoreCalculated,
  onTopRouteCalculated,
  precomputedRoutes,
  precomputedNextConcepts,
  hasSignedUp = false,
}: ResultsScreenProps) {
  const derived = useResultsDerivedData({
    totalCorrect,
    results,
    atomResults,
    responses,
    precomputedRoutes,
    precomputedNextConcepts,
    onScoreCalculated,
    onTopRouteCalculated,
  });

  const ui = useResultsUiState({
    results,
    route,
    totalCorrect,
    performanceTier: derived.performanceTier,
  });

  return (
    <ResultsScreenView
      showContent={ui.showContent}
      hasSignedUp={hasSignedUp}
      isLowSignal={derived.isLowSignal}
      performanceTier={derived.performanceTier}
      totalCorrect={totalCorrect}
      scoreEmphasis={derived.scoreEmphasis}
      midScore={derived.midScore}
      scoreMin={derived.scoreMin}
      scoreMax={derived.scoreMax}
      potentialImprovement={derived.potentialImprovement}
      studyHours={derived.studyHours}
      routesLoading={derived.routesLoading}
      showRoutes={derived.showRoutes}
      showMoreDetails={ui.showMoreDetails}
      sortedRoutes={derived.sortedRoutes}
      lowHangingFruit={derived.routesData?.lowHangingFruit}
      showNextConcepts={derived.showNextConcepts}
      nextConcepts={derived.nextConcepts}
      responsesForReview={derived.responsesForReview}
      showReviewDrawer={ui.showReviewDrawer}
      ctaLabel={CTA_LABEL}
      expectationLine={EXPECTATION_LINE}
      onOpenReview={ui.openReviewDrawer}
      onCloseReview={ui.closeReviewDrawer}
      onToggleRoutes={ui.toggleRoutes}
      onCtaClick={() => onSignup?.()}
    />
  );
}
