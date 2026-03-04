"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Confetti } from "./Confetti";
import { AnimatedCounter } from "./shared";
import {
  TierHeadline,
  LimitationCopy,
  GenericNextStep,
  SecondaryScoreDisplay,
  CtaButton,
} from "./TierContent";
import { ImprovementHeroCard } from "./ImprovementHeroCard";
import { RoutesSection } from "./RoutesSection";
import {
  QuestionReviewDrawer,
  type ResponseForReview,
} from "./QuestionReviewDrawer";
import type {
  LearningRouteData,
  LearningRoutesResponse,
} from "../hooks/useLearningRoutes";
import type { NextConcept } from "@/lib/config";

type PerformanceTier = Parameters<typeof TierHeadline>[0]["tier"];
type ScoreEmphasis = "primary" | "secondary" | "minimal";

function getAnimationClasses(showContent: boolean, delay?: string): string {
  const delayClass = delay ? `delay-${delay}` : "";
  const visibilityClass = showContent
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-8";
  return `transition-all duration-700 ${delayClass} ${visibilityClass}`.trim();
}

function ResultsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Confetti />
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div className="fixed top-20 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="fixed bottom-20 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
            <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
            <span className="text-xl font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </div>
    </div>
  );
}

function CompletionBadge({ showContent }: { showContent: boolean }) {
  return (
    <div className={`text-center mb-6 ${getAnimationClasses(showContent)}`}>
      <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full">
        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
        Diagnóstico Completado
      </div>
    </div>
  );
}

function SignupBanner({ showContent }: { showContent: boolean }) {
  return (
    <div className={`mb-6 ${getAnimationClasses(showContent)}`}>
      <div
        className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r
          from-success/10 to-success/5 border border-success/20 rounded-xl"
      >
        <svg
          className="w-5 h-5 text-success shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="text-success font-medium">
          ¡Listo! Tu diagnóstico está guardado y ya puedes seguir en tu portal.
        </span>
      </div>
    </div>
  );
}

function HeroScore(props: {
  showContent: boolean;
  midScore: number;
  scoreMin: number;
  scoreMax: number;
  totalCorrect: number;
}) {
  return (
    <div
      className={`text-center mb-6 ${getAnimationClasses(props.showContent)}`}
    >
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-2">
        Tu Puntaje PAES Estimado
      </h1>
      <div
        className="text-5xl sm:text-6xl md:text-7xl font-bold text-transparent
          bg-clip-text bg-gradient-to-r from-primary to-primary-light my-4"
      >
        <AnimatedCounter target={props.midScore} duration={2500} delay={200} />
      </div>
      <div className="text-base text-cool-gray mb-2">
        Rango probable: {props.scoreMin}–{props.scoreMax}{" "}
        <span className="text-sm">(≈ ±5 preguntas)</span>
      </div>
      <div className="text-sm text-cool-gray">
        {props.totalCorrect}/16 correctas
      </div>
    </div>
  );
}

function ReviewAnswersCard(props: {
  showContent: boolean;
  responseCount: number;
  onOpen: () => void;
}) {
  return (
    <div className={`mb-6 ${getAnimationClasses(props.showContent, "100")}`}>
      <button
        onClick={props.onOpen}
        className="w-full max-w-md mx-auto flex items-center gap-4 p-4 rounded-xl 
          bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20
          hover:from-primary/15 hover:to-primary/10 hover:border-primary/30
          transition-all duration-300 group"
      >
        <div
          className="w-12 h-12 rounded-full bg-primary/20 flex items-center
            justify-center shrink-0 group-hover:scale-110 transition-transform"
        >
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" +
                "M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              }
            />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-charcoal">
            Revisar mis respuestas
          </div>
          <div className="text-sm text-cool-gray">
            {props.responseCount} preguntas · Ver correctas e incorrectas
          </div>
        </div>
        <svg
          className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

function ResultsTopSection(props: {
  showContent: boolean;
  hasSignedUp: boolean;
  isLowSignal: boolean;
  scoreEmphasis: ScoreEmphasis;
  performanceTier: PerformanceTier;
  totalCorrect: number;
  midScore: number;
  scoreMin: number;
  scoreMax: number;
  responsesForReviewCount: number;
  onOpenReview: () => void;
}) {
  return (
    <>
      <CompletionBadge showContent={props.showContent} />
      {props.hasSignedUp && <SignupBanner showContent={props.showContent} />}

      {props.isLowSignal && (
        <div className={`mb-6 ${getAnimationClasses(props.showContent)}`}>
          <LimitationCopy
            tier={props.performanceTier}
            className="justify-center text-center"
          />
        </div>
      )}

      {props.scoreEmphasis === "primary" && (
        <HeroScore
          showContent={props.showContent}
          midScore={props.midScore}
          scoreMin={props.scoreMin}
          scoreMax={props.scoreMax}
          totalCorrect={props.totalCorrect}
        />
      )}

      {props.hasSignedUp && props.responsesForReviewCount > 0 && (
        <ReviewAnswersCard
          showContent={props.showContent}
          responseCount={props.responsesForReviewCount}
          onOpen={props.onOpenReview}
        />
      )}

      <div
        className={`text-center mb-6 ${getAnimationClasses(props.showContent, "150")}`}
      >
        <TierHeadline
          tier={props.performanceTier}
          totalCorrect={props.totalCorrect}
        />
      </div>

      {props.performanceTier === "perfect" && (
        <div
          className={`mb-6 ${getAnimationClasses(props.showContent, "200")}`}
        >
          <LimitationCopy
            tier={props.performanceTier}
            className="justify-center text-center"
          />
        </div>
      )}
    </>
  );
}

function ResultsCoreSection(props: {
  showContent: boolean;
  hasSignedUp: boolean;
  ctaLabel: string;
  expectationLine: string;
  potentialImprovement: number;
  studyHours: number;
  routesLoading: boolean;
  showRoutes: boolean;
  showMoreDetails: boolean;
  sortedRoutes: LearningRouteData[];
  lowHangingFruit?: LearningRoutesResponse["lowHangingFruit"];
  showNextConcepts: boolean;
  nextConcepts: NextConcept[];
  performanceTier: PerformanceTier;
  scoreEmphasis: ScoreEmphasis;
  scoreMin: number;
  scoreMax: number;
  onToggleRoutes: () => void;
  onCtaClick: () => void;
}) {
  return (
    <>
      <div className={`mb-6 ${getAnimationClasses(props.showContent, "250")}`}>
        <ImprovementHeroCard
          potentialImprovement={props.potentialImprovement}
          studyHours={props.studyHours}
          variant="hero"
          isLoading={props.routesLoading}
        />
      </div>

      {!props.hasSignedUp && (
        <div
          className={`text-center mb-6 ${getAnimationClasses(props.showContent, "300")}`}
        >
          <CtaButton onClick={props.onCtaClick} ctaLabel={props.ctaLabel} />
          <p className="text-xs text-cool-gray mt-3 max-w-md mx-auto">
            {props.expectationLine}
          </p>
        </div>
      )}

      {!props.showRoutes && (
        <div
          className={`mb-6 ${getAnimationClasses(props.showContent, "350")}`}
        >
          <GenericNextStep tier={props.performanceTier} />
        </div>
      )}

      {props.showRoutes && (
        <div
          className={`mb-6 ${getAnimationClasses(props.showContent, "350")}`}
        >
          <RoutesSection
            hasSignedUp={props.hasSignedUp}
            routesLoading={props.routesLoading}
            sortedRoutes={props.sortedRoutes}
            lowHangingFruit={props.lowHangingFruit}
            showMoreDetails={props.showMoreDetails}
            onToggle={props.onToggleRoutes}
            showNextConcepts={props.showNextConcepts}
            nextConcepts={props.nextConcepts}
            performanceTier={props.performanceTier}
            onCtaClick={props.onCtaClick}
          />
        </div>
      )}

      {props.scoreEmphasis !== "primary" && (
        <div className={getAnimationClasses(props.showContent, "400")}>
          <SecondaryScoreDisplay
            scoreMin={props.scoreMin}
            scoreMax={props.scoreMax}
            tier={props.performanceTier}
          />
        </div>
      )}
    </>
  );
}

function SignedUpFooter({ showContent }: { showContent: boolean }) {
  return (
    <div
      className={`text-center mt-10 pb-8 ${getAnimationClasses(showContent, "500")}`}
    >
      <div className="card p-6 bg-gradient-to-br from-success/5 to-white border-success/20 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg
            className="w-5 h-5 text-success"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-semibold text-charcoal">
            Tu diagnóstico está guardado
          </span>
        </div>
        <p className="text-sm text-cool-gray">
          Tu siguiente paso ya está disponible: entra al portal y comienza tu
          sprint desde esta misma ruta.
        </p>
      </div>
      <Link
        href="/portal"
        className="text-sm text-cool-gray hover:text-charcoal transition-colors underline underline-offset-2"
      >
        Ir a mi portal
      </Link>
    </div>
  );
}

export interface ResultsScreenViewProps {
  showContent: boolean;
  hasSignedUp: boolean;
  isLowSignal: boolean;
  performanceTier: PerformanceTier;
  totalCorrect: number;
  scoreEmphasis: ScoreEmphasis;
  midScore: number;
  scoreMin: number;
  scoreMax: number;
  potentialImprovement: number;
  studyHours: number;
  routesLoading: boolean;
  showRoutes: boolean;
  showMoreDetails: boolean;
  sortedRoutes: LearningRouteData[];
  lowHangingFruit?: LearningRoutesResponse["lowHangingFruit"];
  showNextConcepts: boolean;
  nextConcepts: NextConcept[];
  responsesForReview: ResponseForReview[];
  showReviewDrawer: boolean;
  ctaLabel: string;
  expectationLine: string;
  onOpenReview: () => void;
  onCloseReview: () => void;
  onToggleRoutes: () => void;
  onCtaClick: () => void;
}

export function ResultsScreenView(props: ResultsScreenViewProps) {
  return (
    <ResultsShell>
      <ResultsTopSection
        showContent={props.showContent}
        hasSignedUp={props.hasSignedUp}
        isLowSignal={props.isLowSignal}
        scoreEmphasis={props.scoreEmphasis}
        performanceTier={props.performanceTier}
        totalCorrect={props.totalCorrect}
        midScore={props.midScore}
        scoreMin={props.scoreMin}
        scoreMax={props.scoreMax}
        responsesForReviewCount={props.responsesForReview.length}
        onOpenReview={props.onOpenReview}
      />

      <ResultsCoreSection
        showContent={props.showContent}
        hasSignedUp={props.hasSignedUp}
        ctaLabel={props.ctaLabel}
        expectationLine={props.expectationLine}
        potentialImprovement={props.potentialImprovement}
        studyHours={props.studyHours}
        routesLoading={props.routesLoading}
        showRoutes={props.showRoutes}
        showMoreDetails={props.showMoreDetails}
        sortedRoutes={props.sortedRoutes}
        lowHangingFruit={props.lowHangingFruit}
        showNextConcepts={props.showNextConcepts}
        nextConcepts={props.nextConcepts}
        performanceTier={props.performanceTier}
        scoreEmphasis={props.scoreEmphasis}
        scoreMin={props.scoreMin}
        scoreMax={props.scoreMax}
        onToggleRoutes={props.onToggleRoutes}
        onCtaClick={props.onCtaClick}
      />

      {props.hasSignedUp && <SignedUpFooter showContent={props.showContent} />}

      <QuestionReviewDrawer
        isOpen={props.showReviewDrawer}
        onClose={props.onCloseReview}
        responses={props.responsesForReview}
      />
    </ResultsShell>
  );
}
