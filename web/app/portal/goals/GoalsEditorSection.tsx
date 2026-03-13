"use client";

import { useCallback, useEffect, useState } from "react";
import { InlineRecoveryPanel } from "../components";
import { OfferingAutocomplete } from "./OfferingAutocomplete";
import { GoalOption, GoalRecord, MAX_PRIMARY_GOALS } from "./types";

type GoalsEditorSectionProps = {
  dataset: {
    version: string;
    source: string;
    publishedAt: string;
  } | null;
  loading: boolean;
  saving: boolean;
  goals: GoalRecord[];
  options: GoalOption[];
  loadError: string | null;
  error: string | null;
  onRetryLoadGoals: () => void;
  onSetGoalOffering: (priority: number, offeringId: string) => void;
  onAddGoalSlot: () => void;
  onRemoveGoalSlot: (priority: number) => void;
  onSave: () => Promise<void>;
};

function DatasetMeta({
  dataset,
}: {
  dataset: GoalsEditorSectionProps["dataset"];
}) {
  if (!dataset) return null;

  return (
    <p className="text-xs text-gray-400">
      Dataset {dataset.version} · Publicado{" "}
      {new Date(dataset.publishedAt).toLocaleDateString("es-CL")} ·{" "}
      {dataset.source}
    </p>
  );
}

function GoalRow(props: {
  goal: GoalRecord;
  index: number;
  showRemove: boolean;
  options: GoalOption[];
  onSetGoalOffering: GoalsEditorSectionProps["onSetGoalOffering"];
  onRemoveGoalSlot: GoalsEditorSectionProps["onRemoveGoalSlot"];
}) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.02]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Preferencia {props.index + 1}
        </span>
        {props.showRemove && (
          <button
            type="button"
            onClick={() => props.onRemoveGoalSlot(props.goal.priority)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Quitar
          </button>
        )}
      </div>
      <OfferingAutocomplete
        options={props.options}
        selectedOfferingId={props.goal.offeringId}
        onSelectOffering={(offeringId) =>
          props.onSetGoalOffering(props.goal.priority, offeringId)
        }
        idPrefix={`goal-${props.goal.priority}`}
      />
    </div>
  );
}

function GoalsFeedback({
  loadError,
  error,
  onRetryLoadGoals,
}: Pick<GoalsEditorSectionProps, "loadError" | "error" | "onRetryLoadGoals">) {
  if (loadError) {
    return (
      <InlineRecoveryPanel
        message={loadError}
        onRetry={onRetryLoadGoals}
        retryLabel="Intentar de nuevo"
      />
    );
  }

  if (error) {
    return (
      <p
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3
          text-sm text-red-700"
      >
        {error}
      </p>
    );
  }

  return null;
}

function SuccessToast({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-emerald-50 border
        border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 font-medium
        animate-fade-in-up"
    >
      <svg
        className="w-4 h-4 text-emerald-500 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Metas guardadas correctamente
    </div>
  );
}

function SaveGoalsButton({
  disabled,
  saving,
  showSuccess,
  onSave,
}: {
  disabled: boolean;
  saving: boolean;
  showSuccess: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className={[
          "btn-cta text-sm py-3 px-6 flex items-center justify-center",
          "gap-2 disabled:opacity-50 transition-all",
          saving ? "cursor-wait" : "",
        ].join(" ")}
      >
        {saving ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Guardando…
          </>
        ) : (
          "Guardar cambios"
        )}
      </button>
      <SuccessToast visible={showSuccess} />
    </div>
  );
}

function GoalsLoadingState() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
        >
          <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
          <div className="h-11 w-full bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function GoalsEditorSection({
  dataset,
  loading,
  saving,
  goals,
  options,
  loadError,
  error,
  onRetryLoadGoals,
  onSetGoalOffering,
  onAddGoalSlot,
  onRemoveGoalSlot,
  onSave,
}: GoalsEditorSectionProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const handleSave = useCallback(async () => {
    await onSave();
    setShowSuccess(true);
  }, [onSave]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-serif font-semibold text-primary">
          Tus metas de admisión
        </h2>
        <p className="text-sm text-gray-500">
          Tu camino de estudio se ajusta según estas metas. Puedes definir hasta{" "}
          {MAX_PRIMARY_GOALS} preferencias.
        </p>
      </div>

      {loading ? (
        <GoalsLoadingState />
      ) : (
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <GoalRow
              key={goal.priority}
              goal={goal}
              index={index}
              showRemove={goals.length > 1}
              options={options}
              onSetGoalOffering={onSetGoalOffering}
              onRemoveGoalSlot={onRemoveGoalSlot}
            />
          ))}
        </div>
      )}

      {!loading && goals.length < MAX_PRIMARY_GOALS && (
        <button
          type="button"
          onClick={onAddGoalSlot}
          className="flex items-center gap-2 text-sm font-medium text-primary
            hover:text-primary/80 transition-colors py-2 px-3 rounded-lg
            hover:bg-primary/5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar otra preferencia
        </button>
      )}

      <GoalsFeedback
        loadError={loadError}
        error={error}
        onRetryLoadGoals={onRetryLoadGoals}
      />

      <div className="pt-1">
        <SaveGoalsButton
          disabled={saving || loading}
          saving={saving}
          showSuccess={showSuccess}
          onSave={() => void handleSave()}
        />
      </div>

      <DatasetMeta dataset={dataset} />
    </section>
  );
}
