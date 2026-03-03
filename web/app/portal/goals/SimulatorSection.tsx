import { GoalDraft, GoalOption, SimulatorPayload, StudentGoal } from "./types";
import { formatNumber, normalizeTestCode } from "./utils";

type SimulatorSectionProps = {
  loading: boolean;
  simLoading: boolean;
  simulatorError: string | null;
  savedGoals: StudentGoal[];
  selectedGoalId: string | null;
  selectedGoal: StudentGoal | null;
  selectedOption: GoalOption | null;
  selectedDraft: GoalDraft | null;
  simulation: SimulatorPayload | null;
  onSelectGoal: (goalId: string) => void;
  onUpdateDraftScore: (goalId: string, testCode: string, value: string) => void;
  onUpdateDraftBuffer: (goalId: string, value: string) => void;
};

export function SimulatorSection({
  loading,
  simLoading,
  simulatorError,
  savedGoals,
  selectedGoalId,
  selectedGoal,
  selectedOption,
  selectedDraft,
  simulation,
  onSelectGoal,
  onUpdateDraftScore,
  onUpdateDraftBuffer,
}: SimulatorSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-serif font-semibold text-primary">
          Simulador de admisión
        </h2>
        {savedGoals.length > 0 && (
          <select
            value={selectedGoalId ?? ""}
            onChange={(event) => onSelectGoal(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {savedGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                Meta {goal.priority} · {goal.careerName} — {goal.universityName}
              </option>
            ))}
          </select>
        )}
      </div>

      {savedGoals.length === 0 && !loading && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Guarda al menos una meta para activar la simulación.
        </p>
      )}

      {selectedGoal && selectedOption && selectedDraft && (
        <>
          <div className="grid gap-4 md:grid-cols-[1fr_200px]">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Puntajes por prueba (edita y la simulación se recalcula de
                inmediato):
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedOption.weights.map((weight) => {
                  const testCode = normalizeTestCode(weight.testCode);
                  return (
                    <label
                      key={testCode}
                      className="rounded-lg border border-gray-200 p-3 space-y-1"
                    >
                      <span className="block text-sm font-medium text-gray-800">
                        {testCode} ({weight.weightPercent}%)
                      </span>
                      <input
                        type="number"
                        min={100}
                        max={1000}
                        step={1}
                        value={selectedDraft.scores[testCode] ?? ""}
                        onChange={(event) =>
                          onUpdateDraftScore(
                            selectedGoal.id,
                            testCode,
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Ej: 700"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="rounded-lg border border-gray-200 p-3 space-y-2 h-fit">
              <span className="block text-sm font-medium text-gray-800">
                Buffer de seguridad
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={selectedDraft.bufferPoints}
                onChange={(event) =>
                  onUpdateDraftBuffer(selectedGoal.id, event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500">
                Objetivo final = corte + buffer
              </p>
            </label>
          </div>

          {simulatorError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {simulatorError}
            </p>
          )}

          {simLoading && (
            <p className="text-sm text-gray-600">Calculando simulación...</p>
          )}

          {simulation && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Puntaje ponderado</p>
                  <p className="text-xl font-semibold text-primary">
                    {formatNumber(simulation.formula.weightedScore)}
                  </p>
                </article>
                <article className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">
                    Último corte ({simulation.targets.cutoffYear ?? "-"})
                  </p>
                  <p className="text-xl font-semibold text-primary">
                    {formatNumber(simulation.targets.lastCutoff)}
                  </p>
                </article>
                <article className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Objetivo con buffer</p>
                  <p className="text-xl font-semibold text-primary">
                    {formatNumber(simulation.targets.bufferedTarget)}
                  </p>
                </article>
                <article className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">
                    Delta vs objetivo buffer
                  </p>
                  <p
                    className={[
                      "text-xl font-semibold",
                      simulation.admissibility.deltaVsBufferedTarget !== null &&
                      simulation.admissibility.deltaVsBufferedTarget >= 0
                        ? "text-green-700"
                        : "text-red-700",
                    ].join(" ")}
                  >
                    {simulation.admissibility.deltaVsBufferedTarget === null
                      ? "-"
                      : formatNumber(
                          simulation.admissibility.deltaVsBufferedTarget
                        )}
                  </p>
                </article>
              </div>

              {!simulation.formula.isComplete && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Faltan puntajes para:{" "}
                  {simulation.formula.missingTests.join(", ")}.
                </p>
              )}

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Desglose de fórmula
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-3 py-2">Prueba</th>
                      <th className="text-left px-3 py-2">Peso</th>
                      <th className="text-left px-3 py-2">Puntaje</th>
                      <th className="text-left px-3 py-2">Contribución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.formula.components.map((component) => (
                      <tr
                        key={component.testCode}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 text-gray-800">
                          {component.testCode}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {component.weightPercent}%
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatNumber(component.score)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatNumber(component.contribution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <article className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-900 font-medium">
                  Sensibilidad ({simulation.sensitivity.testCode} +
                  {simulation.sensitivity.increment})
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  Nuevo ponderado:{" "}
                  {formatNumber(simulation.sensitivity.adjustedWeightedScore)} ·
                  Delta: {formatNumber(simulation.sensitivity.weightedDelta)}
                </p>
              </article>
            </div>
          )}
        </>
      )}
    </section>
  );
}
