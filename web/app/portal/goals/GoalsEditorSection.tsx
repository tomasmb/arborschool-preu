import { InlineRecoveryPanel } from "../components";
import { GoalRecord, MAX_PRIMARY_GOALS } from "./types";

type GoalOptionItem = {
  offeringId: string;
  label: string;
};

type GoalsEditorSectionProps = {
  dataset: {
    version: string;
    source: string;
    publishedAt: string;
  } | null;
  loading: boolean;
  saving: boolean;
  goals: GoalRecord[];
  options: GoalOptionItem[];
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
  if (!dataset) {
    return null;
  }

  return (
    <p className="text-xs text-gray-500">
      Dataset {dataset.version} · Publicado{" "}
      {new Date(dataset.publishedAt).toLocaleDateString("es-CL")} ·{" "}
      {dataset.source}
    </p>
  );
}

function GoalRow(props: {
  goal: GoalRecord;
  showRemove: boolean;
  options: GoalOptionItem[];
  onSetGoalOffering: GoalsEditorSectionProps["onSetGoalOffering"];
  onRemoveGoalSlot: GoalsEditorSectionProps["onRemoveGoalSlot"];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[80px_1fr_auto] items-center">
      <span className="text-sm font-medium text-gray-700">
        Meta {props.goal.priority}
      </span>
      <select
        value={props.goal.offeringId}
        onChange={(event) =>
          props.onSetGoalOffering(props.goal.priority, event.target.value)
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Selecciona carrera y universidad</option>
        {props.options.map((option) => (
          <option key={option.offeringId} value={option.offeringId}>
            {option.label}
          </option>
        ))}
      </select>
      {props.showRemove ? (
        <button
          type="button"
          onClick={() => props.onRemoveGoalSlot(props.goal.priority)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Quitar
        </button>
      ) : null}
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

  return null;
}

function SaveGoalsButton({
  disabled,
  saving,
  onSave,
}: {
  disabled: boolean;
  saving: boolean;
  onSave: () => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled}
      className={[
        "inline-flex items-center rounded-lg bg-primary text-white px-4 py-2",
        "text-sm font-semibold hover:bg-primary/90 disabled:opacity-50",
      ].join(" ")}
    >
      {saving ? "Guardando..." : "Guardar objetivos"}
    </button>
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
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-xl font-serif font-semibold text-primary">
        Tus metas principales (máximo 3)
      </h2>

      <DatasetMeta dataset={dataset} />

      {loading ? <p className="text-gray-600">Cargando objetivos...</p> : null}

      {!loading ? (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalRow
              key={goal.priority}
              goal={goal}
              showRemove={goals.length > 1}
              options={options}
              onSetGoalOffering={onSetGoalOffering}
              onRemoveGoalSlot={onRemoveGoalSlot}
            />
          ))}
        </div>
      ) : null}

      {!loading && goals.length < MAX_PRIMARY_GOALS ? (
        <button
          type="button"
          onClick={onAddGoalSlot}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Agregar meta
        </button>
      ) : null}

      <GoalsFeedback
        loadError={loadError}
        error={error}
        onRetryLoadGoals={onRetryLoadGoals}
      />

      <div>
        <SaveGoalsButton
          disabled={saving || loading}
          saving={saving}
          onSave={onSave}
        />
      </div>
    </section>
  );
}
