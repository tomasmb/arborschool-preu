"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageShell } from "@/app/portal/components";
import { GoalsEditorSection } from "./GoalsEditorSection";
import { PlanningModeFlow } from "./PlanningModeFlow";
import { SimulatorSection } from "./SimulatorSection";
import { usePortalGoals } from "./usePortalGoals";

type GoalsTab = "metas" | "simulador";

function GoalsTabBar({
  activeTab,
  onChange,
}: {
  activeTab: GoalsTab;
  onChange: (tab: GoalsTab) => void;
}) {
  const tabs: Array<{ id: GoalsTab; label: string; hint: string }> = [
    { id: "metas", label: "Metas de admisión", hint: "Se guardan" },
    { id: "simulador", label: "Simulador", hint: "Solo exploración" },
  ];

  return (
    <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            activeTab === tab.id
              ? "bg-white text-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          <span>{tab.label}</span>
          <span
            className={[
              "block text-[10px] mt-0.5",
              activeTab === tab.id ? "text-gray-400" : "text-gray-400",
            ].join(" ")}
          >
            {tab.hint}
          </span>
        </button>
      ))}
    </div>
  );
}

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

    onRedirect("/portal/goals");
  }, [journeyState, loading, onRedirect, planningModeRequested]);
}

function PortalGoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planningModeRequested = searchParams.get("mode") === "planning";
  const initialTab =
    searchParams.get("tab") === "simulador"
      ? ("simulador" as GoalsTab)
      : ("metas" as GoalsTab);
  const [activeTab, setActiveTab] = useState<GoalsTab>(initialTab);
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
      title={isPlanningMode ? "Planificación inicial" : "Metas y simulador"}
      subtitle={
        isPlanningMode
          ? "Elige tu meta y cuánto quieres estudiar para empezar el diagnóstico."
          : "Configura tus metas de admisión y prueba distintos escenarios."
      }
      hideNav={isPlanningMode}
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
        <div className="space-y-5">
          <GoalsTabBar activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "metas" && (
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
          )}

          {activeTab === "simulador" && (
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
          )}
        </div>
      )}
    </PageShell>
  );
}

function PortalGoalsPageFallback() {
  return (
    <PageShell title="Metas y simulador" subtitle="Cargando tus metas...">
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-24 bg-gray-100 rounded-lg" />
            <div className="h-24 bg-gray-100 rounded-lg" />
          </div>
        </section>
      </div>
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
