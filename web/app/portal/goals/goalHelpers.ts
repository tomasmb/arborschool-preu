import type { GoalOption } from "./types";

// ── Hours stepper constants (shared with ProjectionCard) ─────────────
export const PLANNING_MIN_HOURS = 0.5;
export const PLANNING_MAX_HOURS = 10;
export const PLANNING_HOURS_STEP = 0.5;

// ── PAES exam date helpers ───────────────────────────────────────────

/** Maps a YYYY-MM-DD exam date to { year, period } for the UI selectors. */
export function parseExamDate(raw: string): {
  year: string;
  period: string;
} {
  if (!raw) return { year: "", period: "" };
  const [yyyy, mm] = raw.split("-");
  if (!yyyy || !mm) return { year: "", period: "" };
  return { year: yyyy, period: Number(mm) <= 8 ? "invierno" : "regular" };
}

/** Converts year + period back to a YYYY-MM-DD string for storage. */
export function buildExamDate(year: string, period: string): string {
  if (!year || !period) return "";
  return period === "invierno" ? `${year}-07-01` : `${year}-12-01`;
}

export const PAES_YEAR_OPTIONS = (() => {
  const now = new Date().getFullYear();
  return [now, now + 1, now + 2].map(String);
})();

export const PAES_PERIOD_OPTIONS = [
  { value: "invierno", label: "Invierno (Jun/Jul)" },
  { value: "regular", label: "Regular (Nov/Dic)" },
] as const;

// ── Goal formatting ──────────────────────────────────────────────────

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
