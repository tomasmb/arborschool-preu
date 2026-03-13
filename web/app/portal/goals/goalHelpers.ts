import type { GoalOption } from "./types";

export function formatPlanningCutoff(option: GoalOption | null) {
  if (!option || option.lastCutoff === null) {
    return "No hay puntajes de corte anteriores";
  }

  const score = option.lastCutoff.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (!option.cutoffYear) {
    return `${score} pts`;
  }

  return `${score} pts (admisión ${option.cutoffYear})`;
}

export function selectedPlanningOption(
  options: GoalOption[],
  selectedOfferingId: string
) {
  return (
    options.find((option) => option.offeringId === selectedOfferingId) ?? null
  );
}
