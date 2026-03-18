"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PageShell } from "@/app/portal/components";
import { GoalsEditorSection } from "./GoalsEditorSection";
import { PlanningModeFlow } from "./PlanningModeFlow";
import { SimulatorSection } from "./SimulatorSection";
import type { SimulatorPayload } from "./types";
import { usePortalGoals } from "./usePortalGoals";

type GoalsTab = "metas" | "simulador";

const UNSAVED_MSG =
  "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?";

/**
 * Warns the user before navigating away when there are unsaved changes.
 * Covers browser-level navigation (refresh/close) via `beforeunload`
 * and Next.js client-side navigation by patching `history.pushState`.
 */
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

function GoalsTabBar({
  activeTab,
  onChange,
}: {
  activeTab: GoalsTab;
  onChange: (tab: GoalsTab) => void;
}) {
  const tabs: Array<{ id: GoalsTab; label: string; hint: string }> = [
    { id: "metas", label: "Metas de admisión", hint: "Se guardan" },
    { id: "simulador", label: "Simulador", hint: "Ajusta y guarda puntajes" },
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

/**
 * Shows a contextual study CTA when the simulator reveals a gap
 * between the student's weighted score and the buffered target.
 */
function SimulatorStudyCTA({
  simulation,
}: {
  simulation: SimulatorPayload | null;
}) {
  if (!simulation) return null;
  const delta = simulation.admissibility.deltaVsBufferedTarget;
  if (delta === null || delta >= 0) return null;

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
          Tu siguiente mini-clase te acerca a tu meta
        </p>
        <p className="text-xs text-gray-500">
          Cada concepto dominado mejora tu puntaje M1.
        </p>
      </div>
      <Link href="/portal" className="btn-primary text-xs px-4 py-2 shrink-0">
        Estudiar
      </Link>
    </section>
  );
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

  useUnsavedChangesWarning(portalGoals.isDirty && !isPlanningMode);

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
              options={portalGoals.options}
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
            <>
              <SimulatorSection
                loading={portalGoals.loading}
                simLoading={portalGoals.simLoading}
                saving={portalGoals.saving}
                simulatorError={portalGoals.simulatorError}
                error={portalGoals.error}
                infoMessage={portalGoals.infoMessage}
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
                onSave={portalGoals.handleSave}
              />
              <SimulatorStudyCTA simulation={portalGoals.simulation} />
            </>
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
