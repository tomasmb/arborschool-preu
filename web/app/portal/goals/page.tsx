"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/app/portal/components";
import { GoalsEditorSection } from "./GoalsEditorSection";
import { PlanningModeFlow } from "./PlanningModeFlow";
import { SimulatorSection } from "./SimulatorSection";
import { usePortalGoals } from "./usePortalGoals";

function PortalGoalsPageContent() {
  const searchParams = useSearchParams();
  const isPlanningMode = searchParams.get("mode") === "planning";
  const portalGoals = usePortalGoals();

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
          error={portalGoals.error}
          infoMessage={portalGoals.infoMessage}
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
            error={portalGoals.error}
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
