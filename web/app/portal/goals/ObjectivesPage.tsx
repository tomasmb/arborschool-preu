"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageShell, InlineRecoveryPanel } from "@/app/portal/components";
import { ELECTIVO_SUB_TESTS } from "@/lib/student/constants";
import { CareerPositioningSection } from "./CareerPositioningSection";
import { NemCalculator } from "./NemCalculator";
import { PlanningModeFlow } from "./PlanningModeFlow";
import { ScoreInput } from "./ScoreInput";
import { usePortalObjectives } from "./usePortalObjectives";
import { usePortalGoals } from "./usePortalGoals";
import { testLabel } from "./utils";
import type { FieldSaveStatus } from "./usePortalObjectives";

// ---------------------------------------------------------------------------
// SECTION: SCORE OBJECTIVES
// ---------------------------------------------------------------------------

function RankingLabel() {
  const [showTip, setShowTip] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      Ranking
      <span className="relative">
        <button
          type="button"
          onClick={() => setShowTip((v) => !v)}
          onBlur={() => setShowTip(false)}
          className="text-gray-400 hover:text-gray-500 transition-colors"
          aria-label="Info ranking"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708
                2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0
                11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </button>
        {showTip && (
          <span
            className="absolute right-0 top-full mt-1.5 w-56
              rounded-lg bg-gray-800 text-white text-[11px]
              leading-snug p-2.5 shadow-lg z-20 pointer-events-none"
          >
            El ranking oficial se obtiene en demre.cl o en tu colegio.
            Puedes usar tu NEM como estimación inicial.
          </span>
        )}
      </span>
    </span>
  );
}

const PAES_TESTS = ["M1", "CL"] as const;

function ScoreObjectivesSection({
  scoreTargets,
  profileScores,
  careerInterests,
  fieldStatus,
  onUpdateScore,
  onUpdateProfile,
}: {
  scoreTargets: Record<string, string>;
  profileScores: Record<string, string>;
  careerInterests: { offeringId: string }[];
  fieldStatus: Record<string, FieldSaveStatus>;
  onUpdateScore: (testCode: string, value: string) => void;
  onUpdateProfile: (scoreType: string, value: string) => void;
}) {
  const hasM2Career = careerInterests.length > 0;

  return (
    <section className="card-section space-y-5">
      <div>
        <h2 className="text-xl font-serif font-semibold text-primary">
          Mis objetivos de puntaje
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Define tus metas PAES. Tus cambios se guardan automáticamente.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600">
          Puntajes PAES objetivo
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAES_TESTS.map((tc) => (
            <ScoreInput
              key={tc}
              label={testLabel(tc)}
              value={scoreTargets[tc] ?? ""}
              onChange={(v) => onUpdateScore(tc, v)}
              saveStatus={fieldStatus[tc] ?? "idle"}
            />
          ))}
          {hasM2Career && (
            <ScoreInput
              label={testLabel("M2")}
              value={scoreTargets.M2 ?? ""}
              onChange={(v) => onUpdateScore("M2", v)}
              saveStatus={fieldStatus.M2 ?? "idle"}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            Electivo
          </span>
          <span className="text-[10px] text-gray-400">
            se usa el mejor
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ELECTIVO_SUB_TESTS.map((sub) => (
            <ScoreInput
              key={sub}
              label={testLabel(sub)}
              value={scoreTargets[sub] ?? ""}
              onChange={(v) => onUpdateScore(sub, v)}
              saveStatus={fieldStatus[sub] ?? "idle"}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-600">
            Tu perfil académico
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Estos valores dependen de tus notas. Actualiza tu estimación
            a medida que avanza tu año escolar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <ScoreInput
              label="NEM (Notas)"
              value={profileScores.NEM ?? ""}
              onChange={(v) => onUpdateProfile("NEM", v)}
              hint="tu estimación"
              saveStatus={fieldStatus.NEM ?? "idle"}
            />
            <NemCalculator
              nemValue={profileScores.NEM ?? ""}
              onUseNem={(v) => onUpdateProfile("NEM", v)}
            />
          </div>
          <div className="space-y-1">
            <ScoreInput
              label={<RankingLabel />}
              value={profileScores.RANKING ?? ""}
              onChange={(v) => onUpdateProfile("RANKING", v)}
              hint="tu estimación"
              saveStatus={fieldStatus.RANKING ?? "idle"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// STUDY CTA
// ---------------------------------------------------------------------------

function StudyCTA() {
  return (
    <section
      className="rounded-2xl border border-primary/20 bg-primary/5 p-4
        flex items-center gap-4"
    >
      <div
        className="w-10 h-10 rounded-full bg-primary/10 flex items-center
          justify-center shrink-0"
      >
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54
              6.347a1.125 1.125 0 0 1 0
              1.972l-11.54 6.347a1.125 1.125 0 0
              1-1.667-.986V5.653Z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          Tu siguiente mini-clase te acerca a tus objetivos
        </p>
        <p className="text-xs text-gray-500">
          Cada concepto dominado mejora tu puntaje M1.
        </p>
      </div>
      <Link
        href="/portal/study"
        className="btn-primary text-xs px-4 py-2 shrink-0"
      >
        Estudiar
      </Link>
    </section>
  );
}

// ---------------------------------------------------------------------------
// MAIN CONTENT
// ---------------------------------------------------------------------------

function ObjectivesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planningModeRequested = searchParams.get("mode") === "planning";

  const objectives = usePortalObjectives();
  const portalGoals = usePortalGoals();

  const isPlanningMode =
    planningModeRequested &&
    (objectives.journeyState === null ||
      objectives.journeyState === "planning_required");

  useEffect(() => {
    if (
      !planningModeRequested ||
      objectives.loading ||
      !objectives.journeyState
    ) {
      return;
    }
    if (objectives.journeyState !== "planning_required") {
      router.replace("/portal/goals");
    }
  }, [
    objectives.journeyState,
    objectives.loading,
    planningModeRequested,
    router,
  ]);

  if (isPlanningMode) {
    return (
      <PageShell
        title="Planificación inicial"
        subtitle="Elige tu meta y cuánto quieres estudiar para empezar el diagnóstico."
        hideNav
      >
        <PlanningModeFlow
          loading={portalGoals.loading}
          saving={portalGoals.saving}
          options={portalGoals.options}
          selectedOfferingId={portalGoals.planningOfferingId}
          planningProfile={portalGoals.planningProfile}
          loadError={portalGoals.loadError}
          error={portalGoals.error}
          infoMessage={portalGoals.infoMessage}
          onRetryLoadGoals={portalGoals.retryLoadGoals}
          onSelectOffering={portalGoals.setPlanningOfferingId}
          onPlanningProfileChange={portalGoals.updatePlanningProfile}
          onStartDiagnostic={() => portalGoals.handlePlanningSave(true)}
          onSaveForLater={() => portalGoals.handlePlanningSave(false)}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Mis objetivos"
      subtitle="Define tus metas PAES y explora cómo te posicionas en distintas carreras."
    >
      {objectives.loadError ? (
        <InlineRecoveryPanel
          message={objectives.loadError}
          onRetry={objectives.retryLoad}
          retryLabel="Intentar de nuevo"
          showSecondaryAction={false}
        />
      ) : objectives.loading ? (
        <ObjectivesSkeleton />
      ) : (
        <div className="space-y-5">
          <ScoreObjectivesSection
            scoreTargets={objectives.scoreTargets}
            profileScores={objectives.profileScores}
            careerInterests={objectives.careerInterests}
            fieldStatus={objectives.fieldStatus}
            onUpdateScore={objectives.updateScoreTarget}
            onUpdateProfile={objectives.updateProfileScore}
          />

          <CareerPositioningSection
            careerInterests={objectives.careerInterests}
            options={objectives.options}
            onAddCareer={objectives.addCareerInterest}
            onRemoveCareer={objectives.removeCareerInterest}
            saving={objectives.careerSaving}
            error={objectives.careerError}
          />

          <StudyCTA />
        </div>
      )}
    </PageShell>
  );
}

function ObjectivesSkeleton() {
  return (
    <div className="space-y-4">
      <section className="card-section animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-20 bg-gray-100 rounded-lg" />
            <div className="h-20 bg-gray-100 rounded-lg" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-20 bg-gray-100 rounded-lg" />
            <div className="h-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </section>
      <section className="card-section animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 bg-gray-100 rounded-lg" />
          <div className="h-24 bg-gray-100 rounded-lg" />
        </div>
      </section>
    </div>
  );
}

export default function ObjectivesPage() {
  return (
    <Suspense fallback={<ObjectivesSkeleton />}>
      <ObjectivesContent />
    </Suspense>
  );
}
