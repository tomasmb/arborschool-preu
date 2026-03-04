"use client";

import { useMemo } from "react";
import { InlineRecoveryPanel } from "../components";
import type { GoalOption, PlanningProfileDraft } from "./types";
import {
  formatPlanningCutoff,
  PlanningGoalCombobox,
  selectedPlanningOption,
} from "./PlanningGoalCombobox";

type PlanningModeFlowProps = {
  loading: boolean;
  saving: boolean;
  options: GoalOption[];
  selectedOfferingId: string;
  planningProfile: PlanningProfileDraft;
  loadError: string | null;
  error: string | null;
  infoMessage: string | null;
  onRetryLoadGoals: () => void;
  onSelectOffering: (offeringId: string) => void;
  onPlanningProfileChange: (patch: Partial<PlanningProfileDraft>) => void;
  onStartDiagnostic: () => Promise<void>;
  onSaveForLater: () => Promise<void>;
};

function PlanningMessagePanel({
  loading,
  loadError,
  error,
  infoMessage,
  onRetryLoadGoals,
}: Pick<
  PlanningModeFlowProps,
  "loading" | "loadError" | "error" | "infoMessage" | "onRetryLoadGoals"
>) {
  if (loading) {
    return (
      <p className="text-sm text-gray-600">Cargando datos de admisión...</p>
    );
  }
  if (loadError) {
    return (
      <InlineRecoveryPanel
        message={loadError}
        onRetry={onRetryLoadGoals}
        retryLabel="Reintentar carga"
      />
    );
  }
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (infoMessage) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {infoMessage}
      </p>
    );
  }
  return null;
}

function PlanningActions({
  saving,
  loading,
  selectedOfferingId,
  onStartDiagnostic,
  onSaveForLater,
}: Pick<
  PlanningModeFlowProps,
  | "saving"
  | "loading"
  | "selectedOfferingId"
  | "onStartDiagnostic"
  | "onSaveForLater"
>) {
  const disabled = saving || loading || !selectedOfferingId;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void onStartDiagnostic()}
        disabled={disabled}
        className="btn-primary text-sm disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Empezar diagnóstico"}
      </button>
      <button
        type="button"
        onClick={() => void onSaveForLater()}
        disabled={disabled}
        className="btn-ghost text-sm disabled:opacity-60"
      >
        Guardar y continuar después
      </button>
    </div>
  );
}

function optionLabel(option: GoalOption) {
  return `${option.careerName} — ${option.universityName}`;
}

function PlanningCommitmentSection({
  planningProfile,
  onPlanningProfileChange,
}: Pick<PlanningModeFlowProps, "planningProfile" | "onPlanningProfileChange">) {
  return (
    <li className="space-y-3">
      <h3 className="text-lg font-serif font-semibold text-primary">
        3. Define tu compromiso semanal
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-gray-700">Minutos por semana</span>
          <input
            type="number"
            min={60}
            max={2400}
            step={30}
            value={planningProfile.weeklyMinutesTarget}
            onChange={(event) =>
              onPlanningProfileChange({
                weeklyMinutesTarget: event.target.value,
              })
            }
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-700">Fecha PAES estimada</span>
          <input
            type="date"
            value={planningProfile.examDate}
            onChange={(event) =>
              onPlanningProfileChange({ examDate: event.target.value })
            }
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <input
            type="checkbox"
            checked={planningProfile.reminderInApp}
            onChange={(event) =>
              onPlanningProfileChange({ reminderInApp: event.target.checked })
            }
          />
          <span className="text-sm text-gray-700">Recordatorios en la app</span>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <input
            type="checkbox"
            checked={planningProfile.reminderEmail}
            onChange={(event) =>
              onPlanningProfileChange({ reminderEmail: event.target.checked })
            }
          />
          <span className="text-sm text-gray-700">Recordatorios por email</span>
        </label>
      </div>
    </li>
  );
}

export function PlanningModeFlow(props: PlanningModeFlowProps) {
  const option = useMemo(
    () => selectedPlanningOption(props.options, props.selectedOfferingId),
    [props.options, props.selectedOfferingId]
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 space-y-7">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Modo planificación
        </p>
        <h2 className="text-2xl font-serif font-semibold text-primary">
          Activa tu diagnóstico con una meta clara
        </h2>
        <p className="text-sm text-gray-600">
          Define objetivo, compromiso semanal y fecha. Con eso priorizamos qué
          estudiar primero para tu PAES.
        </p>
      </header>

      <ol className="space-y-6">
        <li className="space-y-3">
          <h3 className="text-lg font-serif font-semibold text-primary">
            1. Elige carrera y universidad objetivo
          </h3>
          <PlanningGoalCombobox
            options={props.options}
            selectedOfferingId={props.selectedOfferingId}
            onSelectOffering={props.onSelectOffering}
          />
        </li>

        <li className="space-y-3">
          <h3 className="text-lg font-serif font-semibold text-primary">
            2. Confirma tu objetivo y transparencia de corte
          </h3>
          <article className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-800">
              {option ? optionLabel(option) : "Aún no seleccionas una meta"}
            </p>
            <p className="text-sm text-gray-600">
              Último corte observado: {formatPlanningCutoff(option)}
            </p>
            <p className="text-xs text-gray-600">
              El simulador mostrará la brecha contra este corte más tu buffer.
            </p>
          </article>
        </li>

        <PlanningCommitmentSection
          planningProfile={props.planningProfile}
          onPlanningProfileChange={props.onPlanningProfileChange}
        />

        <li className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-primary font-medium">
            Este diagnóstico te dirá qué estudiar primero para llegar a tu meta.
          </p>
        </li>
      </ol>

      <PlanningMessagePanel
        loading={props.loading}
        loadError={props.loadError}
        error={props.error}
        infoMessage={props.infoMessage}
        onRetryLoadGoals={props.onRetryLoadGoals}
      />
      <PlanningActions
        saving={props.saving}
        loading={props.loading}
        selectedOfferingId={props.selectedOfferingId}
        onStartDiagnostic={props.onStartDiagnostic}
        onSaveForLater={props.onSaveForLater}
      />
    </section>
  );
}
