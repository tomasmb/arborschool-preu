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
  /** Optional search aliases (lowercase). Allows finding entries by alternate terms. */
  aliases?: string[];
}

export interface CareerGoal extends CareerOption {
  savedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CAREERS: CareerOption[] = [
  // ── MEDICINA ──────────────────────────────────────────────────────────────
  {
    id: "medicina-puc",
    nombre: "Medicina",
    universidad: "PUC",
    puntaje_corte: 958.4,
    aliases: ["medicina puc", "medico puc"],
  },
  {
    id: "medicina-uch",
    nombre: "Medicina",
    universidad: "UCh",
    puntaje_corte: 931.15,
    aliases: ["medicina uch", "medico uch", "u de chile"],
  },
  {
    id: "medicina-usach",
    nombre: "Medicina",
    universidad: "USACH",
    puntaje_corte: 939.35,
    aliases: ["medicina usach", "medico usach", "santiago"],
  },
  {
    id: "medicina-uandes",
    nombre: "Medicina",
    universidad: "U. de los Andes",
    puntaje_corte: 944.0,
    aliases: ["medicina andes", "uandes"],
  },
  // ── INGENIERÍA ────────────────────────────────────────────────────────────
  {
    id: "ingenieria-plan-comun-uch",
    nombre: "Ingeniería Civil / Plan Común",
    universidad: "UCh",
    puntaje_corte: 833.85,
    aliases: [
      "ingenieria civil",
      "plan comun uch",
      "beauchef",
      "ingenieria uch",
    ],
  },
  {
    id: "ingenieria-comercial-uch",
    nombre: "Ingeniería Comercial",
    universidad: "UCh",
    puntaje_corte: 829.6,
    aliases: ["comercial uch", "icm uch"],
  },
  {
    id: "ingenieria-comercial-puc",
    nombre: "Ingeniería Comercial",
    universidad: "PUC",
    puntaje_corte: 826.3,
    aliases: ["comercial puc", "icm puc"],
  },
  {
    id: "ingenieria-comercial-uai",
    nombre: "Ingeniería Comercial",
    universidad: "UAI",
    puntaje_corte: 811.4,
    aliases: ["comercial uai"],
  },
  {
    id: "ingenieria-civil-informatica-puc",
    nombre: "Ingeniería Civil en Computación",
    universidad: "PUC",
    puntaje_corte: 820.0,
    aliases: ["informatica puc", "computacion puc", "icc puc", "programacion"],
  },
  {
    id: "ingenieria-civil-uai",
    nombre: "Ingeniería Civil",
    universidad: "UAI",
    puntaje_corte: 814.95,
    aliases: ["ingenieria uai"],
  },
  {
    id: "int-management-uai",
    nombre: "Ingeniería en Gestión Internacional",
    universidad: "UAI",
    puntaje_corte: 892.5,
    aliases: [
      "gestion internacional",
      "international management",
      "uai negocios",
    ],
  },
  // ── DERECHO ───────────────────────────────────────────────────────────────
  {
    id: "derecho-uch",
    nombre: "Derecho",
    universidad: "UCh",
    puntaje_corte: 851.2,
    aliases: ["abogado uch", "leyes uch"],
  },
  {
    id: "derecho-puc",
    nombre: "Derecho",
    universidad: "PUC",
    puntaje_corte: 826.0,
    aliases: ["abogado puc", "leyes puc"],
  },
  {
    id: "derecho-uai",
    nombre: "Derecho",
    universidad: "UAI",
    puntaje_corte: 768.7,
    aliases: ["abogado uai", "leyes uai"],
  },
  // ── PSICOLOGÍA ────────────────────────────────────────────────────────────
  {
    id: "psicologia-uch",
    nombre: "Psicología",
    universidad: "UCh",
    puntaje_corte: 866.55,
    aliases: ["psico uch"],
  },
  {
    id: "psicologia-puc",
    nombre: "Psicología",
    universidad: "PUC",
    puntaje_corte: 766.2,
    aliases: ["psico puc"],
  },
  {
    id: "psicologia-udd",
    nombre: "Psicología",
    universidad: "UDD",
    puntaje_corte: 710.0,
    aliases: ["psico udd"],
  },
  // ── ARQUITECTURA ──────────────────────────────────────────────────────────
  {
    id: "arquitectura-puc",
    nombre: "Arquitectura",
    universidad: "PUC",
    puntaje_corte: 756.4,
    aliases: ["arq puc"],
  },
  {
    id: "arquitectura-uch",
    nombre: "Arquitectura",
    universidad: "UCh",
    puntaje_corte: 775.0,
    aliases: ["arq uch"],
  },
  // ── SALUD ─────────────────────────────────────────────────────────────────
  {
    id: "kinesiologia-uch",
    nombre: "Kinesiología",
    universidad: "UCh",
    puntaje_corte: 721.5,
    aliases: ["kine uch"],
  },
  {
    id: "kinesiologia-puc",
    nombre: "Kinesiología",
    universidad: "PUC",
    puntaje_corte: 700.0,
    aliases: ["kine puc"],
  },
  {
    id: "odontologia-uch",
    nombre: "Odontología",
    universidad: "UCh",
    puntaje_corte: 810.7,
    aliases: ["dentista uch", "odontologo"],
  },
  {
    id: "enfermeria-puc",
    nombre: "Enfermería",
    universidad: "PUC",
    puntaje_corte: 688.3,
    aliases: ["enf puc"],
  },
  {
    id: "enfermeria-uch",
    nombre: "Enfermería",
    universidad: "UCh",
    puntaje_corte: 672.0,
    aliases: ["enf uch"],
  },
  {
    id: "nutricion-uch",
    nombre: "Nutrición y Dietética",
    universidad: "UCh",
    puntaje_corte: 668.9,
    aliases: ["nutricion", "dietetica", "nutricionista"],
  },
  {
    id: "medicina-veterinaria-uch",
    nombre: "Medicina Veterinaria",
    universidad: "UCh",
    puntaje_corte: 695.0,
    aliases: ["veterinaria", "vet uch", "veterinario"],
  },
  {
    id: "fonoaudiologia-uch",
    nombre: "Fonoaudiología",
    universidad: "UCh",
    puntaje_corte: 660.0,
    aliases: ["fono", "fonoaudiologa"],
  },
  // ── CIENCIAS SOCIALES / HUMANIDADES ──────────────────────────────────────
  {
    id: "estudios-internacionales-uch",
    nombre: "Estudios Internacionales",
    universidad: "UCh",
    puntaje_corte: 869.15,
    aliases: ["relaciones internacionales", "rrii"],
  },
  {
    id: "periodismo-puc",
    nombre: "Periodismo",
    universidad: "PUC",
    puntaje_corte: 720.0,
    aliases: ["comunicaciones puc", "periodista"],
  },
  {
    id: "periodismo-uch",
    nombre: "Periodismo",
    universidad: "UCh",
    puntaje_corte: 700.0,
    aliases: ["comunicaciones uch"],
  },
  {
    id: "sociologia-uch",
    nombre: "Sociología",
    universidad: "UCh",
    puntaje_corte: 730.0,
    aliases: ["socio uch"],
  },
  // ── CIENCIAS ──────────────────────────────────────────────────────────────
  {
    id: "biologia-uch",
    nombre: "Biología",
    universidad: "UCh",
    puntaje_corte: 710.0,
    aliases: ["bio uch", "biologa"],
  },
  // ── NEGOCIOS / ECONOMÍA ───────────────────────────────────────────────────
  {
    id: "contador-auditor-uch",
    nombre: "Contador Auditor",
    universidad: "UCh",
    puntaje_corte: 650.0,
    aliases: ["contabilidad", "contador", "auditoria"],
  },
  {
    id: "administracion-publica-uch",
    nombre: "Administración Pública",
    universidad: "UCh",
    puntaje_corte: 690.0,
    aliases: ["adm publica"],
  },
  // ── PEDAGOGÍAS ────────────────────────────────────────────────────────────
  {
    id: "pedagogia-matematica-uch",
    nombre: "Pedagogía en Matemática",
    universidad: "UCh",
    puntaje_corte: 660.0,
    aliases: ["profe matematica", "pedagogia mate", "ped mat"],
  },
  {
    id: "pedagogia-basica-puc",
    nombre: "Pedagogía Básica",
    universidad: "PUC",
    puntaje_corte: 642.1,
    aliases: ["profe basica", "educacion basica"],
  },
  // ── AÚN NO SÉ ─────────────────────────────────────────────────────────────
  {
    id: "no-se-aun",
    nombre: "Todavía no sé qué estudiar",
    universidad: "Explorar opciones",
    puntaje_corte: 600,
    aliases: ["no se", "explorar", "decidir", "sin carrera"],
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

/** Filter careers by search query (matches nombre, universidad, or aliases — case-insensitive). */
export function filterCareers(query: string): CareerOption[] {
  if (!query.trim()) return CAREERS_SORTED;
  const q = query.toLowerCase().trim();
  return CAREERS_SORTED.filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.universidad.toLowerCase().includes(q) ||
      c.aliases?.some((alias) => alias.includes(q))
  );
}
