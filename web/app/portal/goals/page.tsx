"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PageShell } from "@/app/portal/components";
import { GoalsEditorSection } from "./GoalsEditorSection";
import { PlanningModeFlow } from "./PlanningModeFlow";
import { SimulatorSection } from "./SimulatorSection";
import { usePortalGoals } from "./usePortalGoals";

function usePlanningModeRedirect({
  planningModeRequested,
  loading,
  journeyState,
  onRedirect,
}: {
  planningModeRequested: boolean;
  loading: boolean;
  journeyState: ReturnType<typeof usePortalGoals>["journeyState"];
  onRedirect: (path: string) => void;
}) {
  useEffect(() => {
    if (!planningModeRequested || loading || !journeyState) {
      return;
    }

    if (journeyState === "planning_required") {
      return;
    }

    if (
      journeyState === "activation_ready" ||
      journeyState === "active_learning"
    ) {
      onRedirect("/portal");
      return;
    }

    onRedirect("/portal/goals");
  }, [journeyState, loading, onRedirect, planningModeRequested]);
}

function PortalGoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planningModeRequested = searchParams.get("mode") === "planning";
  const portalGoals = usePortalGoals();
  const isPlanningMode =
    planningModeRequested &&
    (portalGoals.journeyState === null ||
      portalGoals.journeyState === "planning_required");

  usePlanningModeRedirect({
    planningModeRequested,
    loading: portalGoals.loading,
    journeyState: portalGoals.journeyState,
    onRedirect: (path) => router.replace(path),
  });

  return (
    <PageShell
      eyebrow="Portal estudiante"
      title={isPlanningMode ? "Planificación inicial" : "Objetivos y admisión"}
      subtitle={
        isPlanningMode
          ? "Define meta y compromiso semanal para activar un diagnóstico con foco."
          : "Gestiona metas, ajusta buffer y valida brecha de admisión con simulador."
      }
      actions={
        <Link
          href="/portal"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Volver al portal
        </Link>
      }
    >
      {isPlanningMode ? (
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
      ) : (
        <>
          <GoalsEditorSection
            dataset={portalGoals.dataset}
            loading={portalGoals.loading}
            saving={portalGoals.saving}
            goals={portalGoals.goals}
            options={portalGoals.availableOptions}
            loadError={portalGoals.loadError}
            error={portalGoals.error}
            onRetryLoadGoals={portalGoals.retryLoadGoals}
            onSetGoalOffering={portalGoals.setGoalOffering}
            onAddGoalSlot={portalGoals.addGoalSlot}
            onRemoveGoalSlot={portalGoals.removeGoalSlot}
            onSave={portalGoals.handleSave}
          />

          <SimulatorSection
            loading={portalGoals.loading}
            simLoading={portalGoals.simLoading}
            simulatorError={portalGoals.simulatorError}
            savedGoals={portalGoals.savedGoals}
            selectedGoalId={portalGoals.selectedGoalId}
            selectedGoal={portalGoals.selectedGoal}
            selectedOption={portalGoals.selectedOption}
            selectedDraft={portalGoals.selectedDraft}
            simulation={portalGoals.simulation}
            onRetrySimulation={portalGoals.retrySimulation}
            onSelectGoal={portalGoals.setSelectedGoalId}
            onUpdateDraftScore={portalGoals.updateDraftScore}
            onUpdateDraftBuffer={portalGoals.updateDraftBuffer}
          />
        </>
      )}
    </PageShell>
  );
}

function PortalGoalsPageFallback() {
  return (
    <PageShell
      eyebrow="Portal estudiante"
      title="Objetivos y admisión"
      subtitle="Cargando configuración de objetivos..."
      actions={
        <Link
          href="/portal"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Volver al portal
        </Link>
      }
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">
          Preparando tu panel de objetivos...
        </p>
      </section>
    </PageShell>
  );
}

export default function PortalGoalsPage() {
  return (
    <Suspense fallback={<PortalGoalsPageFallback />}>
      <PortalGoalsPageContent />
    </Suspense>
  );
}
