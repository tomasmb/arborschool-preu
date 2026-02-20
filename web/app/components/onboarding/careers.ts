/**
 * Career data for the Goal Anchor onboarding screen.
 *
 * Source: Admisión 2025 (preuai.com / acceso.mineduc.cl)
 * Puntajes: puntaje ponderado del último matriculado (puntaje de corte).
 * Nota: Los puntajes varían año a año. Actualizar con datos DEMRE para cada proceso.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CareerOption {
  id: string;
  nombre: string;
  universidad: string;
  puntaje_corte: number;
}

export interface CareerGoal extends CareerOption {
  savedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CAREERS: CareerOption[] = [
  {
    id: "medicina-puc",
    nombre: "Medicina",
    universidad: "PUC",
    puntaje_corte: 958.4,
  },
  {
    id: "medicina-uch",
    nombre: "Medicina",
    universidad: "UCh",
    puntaje_corte: 931.15,
  },
  {
    id: "int-management-uai",
    nombre: "International Management",
    universidad: "UAI",
    puntaje_corte: 892.5,
  },
  {
    id: "derecho-uch",
    nombre: "Derecho",
    universidad: "UCh",
    puntaje_corte: 851.2,
  },
  {
    id: "ingenieria-plan-comun-uch",
    nombre: "Ingeniería Plan Común",
    universidad: "UCh",
    puntaje_corte: 833.85,
  },
  {
    id: "ingenieria-comercial-uch",
    nombre: "Ingeniería Comercial",
    universidad: "UCh",
    puntaje_corte: 829.6,
  },
  {
    id: "ingenieria-comercial-puc",
    nombre: "Ingeniería Comercial",
    universidad: "PUC",
    puntaje_corte: 826.3,
  },
  {
    id: "ingenieria-civil-uai",
    nombre: "Ingeniería Civil en Informática",
    universidad: "UAI",
    puntaje_corte: 814.95,
  },
  {
    id: "arquitectura-puc",
    nombre: "Arquitectura",
    universidad: "PUC",
    puntaje_corte: 756.4,
  },
  {
    id: "psicologia-puc",
    nombre: "Psicología",
    universidad: "PUC",
    puntaje_corte: 766.2,
  },
  {
    id: "psicologia-uch",
    nombre: "Psicología",
    universidad: "UCh",
    puntaje_corte: 749.8,
  },
  {
    id: "kinesiologia-uch",
    nombre: "Kinesiología",
    universidad: "UCh",
    puntaje_corte: 721.5,
  },
  {
    id: "nutricion-uch",
    nombre: "Nutrición y Dietética",
    universidad: "UCh",
    puntaje_corte: 668.9,
  },
  {
    id: "enfermeria-puc",
    nombre: "Enfermería",
    universidad: "PUC",
    puntaje_corte: 688.3,
  },
  {
    id: "pedagogia-basica-puc",
    nombre: "Pedagogía Básica",
    universidad: "PUC",
    puntaje_corte: 642.1,
  },
];

// localStorage key for career goal
export const CAREER_GOAL_KEY = "arbor_career_goal";

// Sorted by puntaje_corte descending for display
export const CAREERS_SORTED = [...CAREERS].sort(
  (a, b) => b.puntaje_corte - a.puntaje_corte
);

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

/** Save selected career goal to localStorage for persistence across sessions. */
export function saveCareerGoal(career: CareerOption): void {
  const goal: CareerGoal = {
    ...career,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CAREER_GOAL_KEY, JSON.stringify(goal));
  } catch {
    // localStorage might be unavailable in some environments — fail silently
    // TODO(v2): persist career goal to user_career_goals table via API
  }
}

/** Read career goal from localStorage. Returns null if not set or parse fails. */
export function getCareerGoal(): CareerGoal | null {
  try {
    const raw = localStorage.getItem(CAREER_GOAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CareerGoal;
  } catch {
    return null;
  }
}

// ============================================================================
// SEARCH HELPERS
// ============================================================================

/** Filter careers by search query (matches nombre or universidad, case-insensitive). */
export function filterCareers(query: string): CareerOption[] {
  if (!query.trim()) return CAREERS_SORTED;
  const q = query.toLowerCase().trim();
  return CAREERS_SORTED.filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.universidad.toLowerCase().includes(q)
  );
}
