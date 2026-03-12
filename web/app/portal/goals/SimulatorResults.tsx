import type { SimulatorPayload } from "./types";
import { formatNumber } from "./utils";

function GapProgressBar({
  weighted,
  target,
}: {
  weighted: number;
  target: number;
}) {
  const pct = Math.min(100, Math.max(0, (weighted / target) * 100));
  const surplus = weighted >= target;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>0</span>
        <span>Objetivo: {formatNumber(target)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            surplus
              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
              : "bg-gradient-to-r from-red-300 to-amber-400",
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function GapIndicator({ simulation }: { simulation: SimulatorPayload }) {
  const delta = simulation.admissibility.deltaVsBufferedTarget;
  const isPositive = delta !== null && delta >= 0;
  const cutoff = simulation.targets.lastCutoff;
  const target = simulation.targets.bufferedTarget;
  const weighted = simulation.formula.weightedScore;

  return (
    <div
      className={[
        "rounded-xl border-2 p-5 space-y-3",
        isPositive
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : "border-red-200 bg-gradient-to-br from-red-50 to-white",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {isPositive ? (
          <svg
            className="w-5 h-5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        )}
        <p
          className={[
            "text-sm font-semibold",
            isPositive ? "text-emerald-700" : "text-red-700",
          ].join(" ")}
        >
          {isPositive
            ? "Alcanzas tu objetivo con margen"
            : "Aún no alcanzas tu objetivo"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-500">Tu ponderado</p>
          <p className="text-lg font-bold text-primary tabular-nums">
            {formatNumber(weighted)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">
            Corte {simulation.targets.cutoffYear ?? ""}
          </p>
          <p className="text-lg font-bold text-gray-700 tabular-nums">
            {formatNumber(cutoff)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Diferencia</p>
          <p
            className={[
              "text-lg font-bold tabular-nums",
              isPositive ? "text-emerald-600" : "text-red-600",
            ].join(" ")}
          >
            {delta === null
              ? "—"
              : `${delta >= 0 ? "+" : ""}${formatNumber(delta)}`}
          </p>
        </div>
      </div>

      {target !== null && weighted !== null && (
        <GapProgressBar weighted={weighted} target={target} />
      )}
    </div>
  );
}

export function MissingTestsNotice({
  simulation,
}: {
  simulation: SimulatorPayload;
}) {
  if (simulation.formula.isComplete) return null;

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
        Faltan puntajes: {simulation.formula.missingTests.join(", ")}
      </p>
    </div>
  );
}

export function SimulatorFormulaTable({
  simulation,
}: {
  simulation: SimulatorPayload;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
        <h3 className="text-sm font-semibold text-gray-700">
          Desglose de fórmula
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-500">
            <th className="text-left px-4 py-2 font-medium">Prueba</th>
            <th className="text-left px-4 py-2 font-medium">Peso</th>
            <th className="text-left px-4 py-2 font-medium">Puntaje</th>
            <th className="text-left px-4 py-2 font-medium">Aporte</th>
          </tr>
        </thead>
        <tbody>
          {simulation.formula.components.map((component) => (
            <tr
              key={component.testCode}
              className="border-t border-gray-50 hover:bg-gray-50/50
                transition-colors"
            >
              <td className="px-4 py-2.5 font-medium text-gray-800">
                {component.testCode}
              </td>
              <td className="px-4 py-2.5 text-gray-600">
                {component.weightPercent}%
              </td>
              <td className="px-4 py-2.5 text-gray-600 tabular-nums">
                {formatNumber(component.score)}
              </td>
              <td className="px-4 py-2.5 text-gray-600 tabular-nums">
                {formatNumber(component.contribution)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SimulatorSensitivity({
  simulation,
}: {
  simulation: SimulatorPayload;
}) {
  return (
    <div
      className="rounded-xl border border-blue-100 bg-gradient-to-br
        from-blue-50/80 to-white p-4 space-y-1"
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide
          text-blue-400"
      >
        Tip de mejora
      </p>
      <p className="text-sm font-medium text-blue-800">
        Sube {simulation.sensitivity.testCode} en +
        {simulation.sensitivity.increment} puntos
      </p>
      <p className="text-sm text-blue-600">
        Nuevo ponderado:{" "}
        <span className="font-semibold">
          {formatNumber(simulation.sensitivity.adjustedWeightedScore)}
        </span>{" "}
        · Cambio:{" "}
        <span className="font-semibold">
          {formatNumber(simulation.sensitivity.weightedDelta)}
        </span>
      </p>
    </div>
  );
}
