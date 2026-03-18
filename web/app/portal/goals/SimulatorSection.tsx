import { InlineRecoveryPanel } from "../components";
import type {
  GoalDraft,
  GoalOption,
  SimulatorPayload,
  StudentGoal,
} from "./types";
import {
  ELECTIVO_SUB_TESTS,
  ELECTIVO_TEST_CODE,
} from "@/lib/student/simulator";
import {
  GapIndicator,
  MissingTestsNotice,
  SimulatorFormulaTable,
} from "./SimulatorResults";
import { normalizeTestCode, testLabel } from "./utils";

type SimulatorSectionProps = {
  loading: boolean;
  simLoading: boolean;
  saving: boolean;
  simulatorError: string | null;
  error: string | null;
  infoMessage: string | null;
  savedGoals: StudentGoal[];
  selectedGoalId: string | null;
  selectedGoal: StudentGoal | null;
  selectedOption: GoalOption | null;
  selectedDraft: GoalDraft | null;
  simulation: SimulatorPayload | null;
  onRetrySimulation: () => void;
  onSelectGoal: (goalId: string) => void;
  onUpdateDraftScore: (goalId: string, testCode: string, value: string) => void;
  onUpdateDraftBuffer: (goalId: string, value: string) => void;
  onSave: () => void;
};

function SimulatorHeader({
  savedGoals,
  selectedGoalId,
  onSelectGoal,
}: Pick<
  SimulatorSectionProps,
  "savedGoals" | "selectedGoalId" | "onSelectGoal"
>) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-serif font-semibold text-primary">
        Simulador de admisión
      </h2>
      <p className="text-sm text-gray-500">
        Ajusta tus puntajes y mira al instante si alcanzas el corte.
      </p>
      {savedGoals.length > 1 && (
        <div className="pt-2">
          <div className="relative">
            <select
              value={selectedGoalId ?? ""}
              onChange={(event) => onSelectGoal(event.target.value)}
              className="w-full appearance-none rounded-lg border
                border-gray-200 bg-gray-50 pl-4 pr-10 py-2.5 text-sm
                cursor-pointer focus:border-primary focus:ring-2
                focus:ring-primary/10 focus:outline-none transition-all"
            >
              {savedGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  Meta {goal.priority} · {goal.careerName} —{" "}
                  {goal.universityName}
                </option>
              ))}
            </select>
            <div
              className="pointer-events-none absolute inset-y-0 right-0
                flex items-center pr-3"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimulatorNoGoalsNotice({
  loading,
  savedGoals,
}: Pick<SimulatorSectionProps, "loading" | "savedGoals">) {
  if (savedGoals.length > 0 || loading) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3
        flex items-start gap-3"
    >
      <svg
        className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <p className="text-sm text-amber-700">
        Guarda al menos una meta arriba para activar la simulación.
      </p>
    </div>
  );
}

function filterNumericInput(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function ScoreInputCard({
  testCode,
  label,
  weightPercent,
  value,
  onChange,
}: {
  testCode: string;
  label: string;
  weightPercent: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50/50 p-4
        transition-colors hover:border-primary/20 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span
          className="text-xs font-medium text-gray-400 bg-gray-100
            px-2 py-0.5 rounded-full"
        >
          {weightPercent}%
        </span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(filterNumericInput(e.target.value))}
        placeholder="Ej: 700"
        className="w-full rounded-lg border border-gray-200 bg-white px-3
          py-2.5 text-sm font-medium tabular-nums
          focus:border-primary focus:ring-2 focus:ring-primary/10
          focus:outline-none transition-all placeholder:text-gray-300"
      />
    </div>
  );
}

function ElectivoInputGroup({
  weightPercent,
  scores,
  goalId,
  onUpdateDraftScore,
}: {
  weightPercent: number;
  scores: Record<string, string>;
  goalId: string;
  onUpdateDraftScore: (goalId: string, testCode: string, val: string) => void;
}) {
  return (
    <div className="col-span-full space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">
          Electivo (se usa el mejor)
        </span>
        <span
          className="text-xs font-medium text-gray-400 bg-gray-100
            px-2 py-0.5 rounded-full"
        >
          {weightPercent}%
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ELECTIVO_SUB_TESTS.map((sub) => (
          <ScoreInputCard
            key={sub}
            testCode={sub}
            label={testLabel(sub)}
            weightPercent={weightPercent}
            value={scores[sub] ?? ""}
            onChange={(value) => onUpdateDraftScore(goalId, sub, value)}
          />
        ))}
      </div>
    </div>
  );
}

function ScoreInputs({
  selectedGoal,
  selectedOption,
  selectedDraft,
  onUpdateDraftScore,
}: Pick<
  SimulatorSectionProps,
  "selectedGoal" | "selectedOption" | "selectedDraft" | "onUpdateDraftScore"
>) {
  if (!selectedGoal || !selectedOption || !selectedDraft) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-600">Puntajes por prueba</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {selectedOption.weights.map((weight) => {
          const testCode = normalizeTestCode(weight.testCode);

          if (testCode === ELECTIVO_TEST_CODE) {
            return (
              <ElectivoInputGroup
                key="ELECTIVO"
                weightPercent={weight.weightPercent}
                scores={selectedDraft.scores}
                goalId={selectedGoal.id}
                onUpdateDraftScore={onUpdateDraftScore}
              />
            );
          }

          return (
            <ScoreInputCard
              key={testCode}
              testCode={testCode}
              label={testLabel(testCode)}
              weightPercent={weight.weightPercent}
              value={selectedDraft.scores[testCode] ?? ""}
              onChange={(value) =>
                onUpdateDraftScore(selectedGoal.id, testCode, value)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function BufferInput({
  selectedGoal,
  selectedDraft,
  onUpdateDraftBuffer,
}: Pick<
  SimulatorSectionProps,
  "selectedGoal" | "selectedDraft" | "onUpdateDraftBuffer"
>) {
  if (!selectedGoal || !selectedDraft) return null;

  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50/50 p-4
        space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">
          Margen de seguridad
        </span>
        <span className="text-xs text-gray-400">puntos extra</span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={selectedDraft.bufferPoints}
        onChange={(e) =>
          onUpdateDraftBuffer(
            selectedGoal.id,
            filterNumericInput(e.target.value)
          )
        }
        className="w-full rounded-lg border border-gray-200 bg-white px-3
          py-2.5 text-sm font-medium tabular-nums
          focus:border-primary focus:ring-2 focus:ring-primary/10
          focus:outline-none transition-all"
      />
      <p className="text-xs text-gray-400">
        Tu objetivo = último corte + este margen
      </p>
    </div>
  );
}

function SimulatorInputs(
  props: Pick<
    SimulatorSectionProps,
    | "selectedGoal"
    | "selectedOption"
    | "selectedDraft"
    | "onUpdateDraftScore"
    | "onUpdateDraftBuffer"
  >
) {
  if (!props.selectedGoal || !props.selectedOption || !props.selectedDraft) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ScoreInputs
        selectedGoal={props.selectedGoal}
        selectedOption={props.selectedOption}
        selectedDraft={props.selectedDraft}
        onUpdateDraftScore={props.onUpdateDraftScore}
      />
      <BufferInput
        selectedGoal={props.selectedGoal}
        selectedDraft={props.selectedDraft}
        onUpdateDraftBuffer={props.onUpdateDraftBuffer}
      />
    </div>
  );
}

function SimulatorStatusPanels({
  simulatorError,
  onRetrySimulation,
  simLoading,
}: Pick<
  SimulatorSectionProps,
  "simulatorError" | "onRetrySimulation" | "simLoading"
>) {
  return (
    <>
      {simulatorError && (
        <InlineRecoveryPanel
          message={simulatorError}
          onRetry={onRetrySimulation}
          retryLabel="Intentar de nuevo"
          showSecondaryAction={false}
        />
      )}
      {simLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="w-4 h-4 animate-spin text-primary"
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
          Calculando simulación…
        </div>
      )}
    </>
  );
}

function SimulatorResultsPanel({
  simulation,
}: {
  simulation: SimulatorPayload | null;
}) {
  if (!simulation) return null;

  return (
    <div className="space-y-4">
      <GapIndicator simulation={simulation} />
      <MissingTestsNotice simulation={simulation} />
      <SimulatorFormulaTable simulation={simulation} />
    </div>
  );
}

function SimulatorSaveButton({
  saving,
  error,
  infoMessage,
  onSave,
}: Pick<SimulatorSectionProps, "saving" | "error" | "infoMessage" | "onSave">) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm
          font-medium text-white transition-colors hover:bg-primary/90
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Guardando…" : "Guardar puntajes"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {infoMessage ? (
        <p className="text-xs text-emerald-600">{infoMessage}</p>
      ) : null}
    </div>
  );
}

function SimulatorWorkspace(
  props: Pick<
    SimulatorSectionProps,
    | "selectedGoal"
    | "selectedOption"
    | "selectedDraft"
    | "onUpdateDraftScore"
    | "onUpdateDraftBuffer"
    | "simulatorError"
    | "onRetrySimulation"
    | "simLoading"
    | "simulation"
    | "saving"
    | "error"
    | "infoMessage"
    | "onSave"
  >
) {
  if (!props.selectedGoal || !props.selectedOption || !props.selectedDraft) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Settings: scores, buffer, and save action */}
      <div
        className="rounded-xl border border-gray-200 bg-gray-50/30
          p-4 space-y-4"
      >
        <p className="text-sm font-semibold text-gray-700">Tus puntajes</p>
        <SimulatorInputs
          selectedGoal={props.selectedGoal}
          selectedOption={props.selectedOption}
          selectedDraft={props.selectedDraft}
          onUpdateDraftScore={props.onUpdateDraftScore}
          onUpdateDraftBuffer={props.onUpdateDraftBuffer}
        />
        <SimulatorSaveButton
          saving={props.saving}
          error={props.error}
          infoMessage={props.infoMessage}
          onSave={props.onSave}
        />
      </div>

      {/* Results: gap indicator + formula breakdown */}
      <div
        className="rounded-xl border border-gray-200 bg-white
          p-4 space-y-4"
      >
        <p className="text-sm font-semibold text-gray-700">Resultados</p>
        <SimulatorStatusPanels
          simulatorError={props.simulatorError}
          onRetrySimulation={props.onRetrySimulation}
          simLoading={props.simLoading}
        />
        <SimulatorResultsPanel simulation={props.simulation} />
      </div>
    </div>
  );
}

export function SimulatorSection(props: SimulatorSectionProps) {
  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6
        space-y-5"
    >
      <SimulatorHeader
        savedGoals={props.savedGoals}
        selectedGoalId={props.selectedGoalId}
        onSelectGoal={props.onSelectGoal}
      />
      <SimulatorNoGoalsNotice
        loading={props.loading}
        savedGoals={props.savedGoals}
      />
      <SimulatorWorkspace
        selectedGoal={props.selectedGoal}
        selectedOption={props.selectedOption}
        selectedDraft={props.selectedDraft}
        onUpdateDraftScore={props.onUpdateDraftScore}
        onUpdateDraftBuffer={props.onUpdateDraftBuffer}
        simulatorError={props.simulatorError}
        onRetrySimulation={props.onRetrySimulation}
        simLoading={props.simLoading}
        simulation={props.simulation}
        saving={props.saving}
        error={props.error}
        infoMessage={props.infoMessage}
        onSave={props.onSave}
      />
    </section>
  );
}
