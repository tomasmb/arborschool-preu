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
  error: string | null;
  onSetGoalOffering: (priority: number, offeringId: string) => void;
  onAddGoalSlot: () => void;
  onRemoveGoalSlot: (priority: number) => void;
  onSave: () => Promise<void>;
};

export function GoalsEditorSection({
  dataset,
  loading,
  saving,
  goals,
  options,
  error,
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

      {dataset && (
        <p className="text-xs text-gray-500">
          Dataset {dataset.version} · Publicado{" "}
          {new Date(dataset.publishedAt).toLocaleDateString("es-CL")} ·{" "}
          {dataset.source}
        </p>
      )}

      {loading && <p className="text-gray-600">Cargando objetivos...</p>}

      {!loading && (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.priority}
              className="grid gap-2 sm:grid-cols-[80px_1fr_auto] items-center"
            >
              <span className="text-sm font-medium text-gray-700">
                Meta {goal.priority}
              </span>
              <select
                value={goal.offeringId}
                onChange={(event) =>
                  onSetGoalOffering(goal.priority, event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecciona carrera y universidad</option>
                {options.map((option) => (
                  <option key={option.offeringId} value={option.offeringId}>
                    {option.label}
                  </option>
                ))}
              </select>
              {goals.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveGoalSlot(goal.priority)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && goals.length < MAX_PRIMARY_GOALS && (
        <button
          type="button"
          onClick={onAddGoalSlot}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Agregar meta
        </button>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || loading}
          className={[
            "inline-flex items-center rounded-lg bg-primary text-white px-4 py-2",
            "text-sm font-semibold hover:bg-primary/90 disabled:opacity-50",
          ].join(" ")}
        >
          {saving ? "Guardando..." : "Guardar objetivos"}
        </button>
      </div>
    </section>
  );
}
