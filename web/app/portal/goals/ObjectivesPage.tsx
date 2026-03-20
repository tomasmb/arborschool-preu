"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { PageShell, InlineRecoveryPanel } from "@/app/portal/components";
import { ELECTIVO_SUB_TESTS } from "@/lib/student/constants";
import { CareerPositioningSection } from "./CareerPositioningSection";
import { PlanningModeFlow } from "./PlanningModeFlow";
import { ScoreInput } from "./ScoreInput";
import { usePortalObjectives } from "./usePortalObjectives";
import { usePortalGoals } from "./usePortalGoals";
import { testLabel } from "./utils";

const UNSAVED_MSG =
  "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?";

function useUnsavedChangesWarning(isDirty: boolean) {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
    };

    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args: Parameters<History["pushState"]>) {
      if (dirtyRef.current && !window.confirm(UNSAVED_MSG)) return;
      return originalPushState(...args);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      history.pushState = originalPushState;
    };
  }, []);
}

// ---------------------------------------------------------------------------
// SECTION: SCORE OBJECTIVES
// ---------------------------------------------------------------------------

const PAES_TESTS = ["M1", "CL"] as const;

function ScoreObjectivesSection({
  scoreTargets,
  profileScores,
  careerInterests,
  onUpdateScore,
  onUpdateProfile,
}: {
  scoreTargets: Record<string, string>;
  profileScores: Record<string, string>;
  careerInterests: { offeringId: string }[];
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
          Define tus metas PAES. Estos son TUS objetivos — puedes cambiarlos
          cuando quieras.
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
            />
          ))}
          {hasM2Career && (
            <ScoreInput
              label={testLabel("M2")}
              value={scoreTargets.M2 ?? ""}
              onChange={(v) => onUpdateScore("M2", v)}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Electivo</span>
          <span className="text-[10px] text-gray-400">se usa el mejor</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ELECTIVO_SUB_TESTS.map((sub) => (
            <ScoreInput
              key={sub}
              label={testLabel(sub)}
              value={scoreTargets[sub] ?? ""}
              onChange={(v) => onUpdateScore(sub, v)}
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
            Estos valores dependen de tus notas. Actualiza tu estimación a
            medida que avanza tu año escolar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ScoreInput
            label="NEM (Notas)"
            value={profileScores.NEM ?? ""}
            onChange={(v) => onUpdateProfile("NEM", v)}
            hint="tu estimación"
          />
          <ScoreInput
            label="Ranking"
            value={profileScores.RANKING ?? ""}
            onChange={(v) => onUpdateProfile("RANKING", v)}
            hint="tu estimación"
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SAVE BAR
// ---------------------------------------------------------------------------

function SaveBar({
  isDirty,
  saving,
  error,
  infoMessage,
  onSave,
}: {
  isDirty: boolean;
  saving: boolean;
  error: string | null;
  infoMessage: string | null;
  onSave: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={saving || !isDirty}
        onClick={onSave}
        className="btn-primary w-full py-2.5
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {infoMessage && <p className="text-xs text-emerald-600">{infoMessage}</p>}
    </div>
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
      <Link href="/portal/study" className="btn-primary text-xs px-4 py-2 shrink-0">
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

  useUnsavedChangesWarning(objectives.isDirty && !isPlanningMode);

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
            onUpdateScore={objectives.updateScoreTarget}
            onUpdateProfile={objectives.updateProfileScore}
          />

          <SaveBar
            isDirty={objectives.isDirty}
            saving={objectives.saving}
            error={objectives.error}
            infoMessage={objectives.infoMessage}
            onSave={objectives.handleSave}
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
