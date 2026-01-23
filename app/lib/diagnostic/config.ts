/**
 * MST Diagnostic Configuration
 *
 * Multi-Stage Testing configuration for the PAES M1 diagnostic.
 * Adapted from the PoC with full coverage optimization.
 */

// Axis types for M1
export type Axis = "ALG" | "NUM" | "GEO" | "PROB";

// Skill types aligned with PAES competencies
export type Skill = "RES" | "MOD" | "REP" | "ARG";

// Route determined by Stage 1 performance
export type Route = "A" | "B" | "C";

// Question definition for the MST
export interface MSTQuestion {
  exam: string;
  questionNumber: string;
  axis: Axis;
  skill: Skill;
  difficulty: number; // 0-1 scale
}

// Number of questions per stage (R1 has 8, each route has 8)
export const QUESTIONS_PER_STAGE = 8;

// Human-readable names for display
export const AXIS_NAMES: Record<Axis, string> = {
  ALG: "Álgebra y Funciones",
  NUM: "Números",
  GEO: "Geometría",
  PROB: "Probabilidad y Estadística",
};

export const SKILL_NAMES: Record<Skill, string> = {
  RES: "Resolver Problemas",
  MOD: "Modelar",
  REP: "Representar",
  ARG: "Argumentar y Comunicar",
};

export const ROUTE_NAMES: Record<Route, string> = {
  A: "Nivel Fundamental",
  B: "Nivel Intermedio",
  C: "Nivel Avanzado",
};

/**
 * MST Question Configuration
 * 32 questions total: 8 routing + 24 adaptive (8 per route)
 * Coverage: 83% of atoms (190/229)
 */
export const MST_QUESTIONS = {
  // Stage 1: Routing questions (R1)
  R1: [
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q28",
      axis: "ALG" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.45,
    },
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q31",
      axis: "ALG" as Axis,
      skill: "MOD" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q23",
      axis: "NUM" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.45,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q15",
      axis: "NUM" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q46",
      axis: "GEO" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.45,
    },
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q45",
      axis: "GEO" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q58",
      axis: "PROB" as Axis,
      skill: "REP" as Skill,
      difficulty: 0.45,
    },
    {
      exam: "seleccion-regular-2026",
      questionNumber: "Q60",
      axis: "PROB" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.45,
    },
  ],

  // Stage 2: Route A - Easier questions for lower performers
  A2: [
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q40",
      axis: "ALG" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.25,
    },
    {
      exam: "seleccion-regular-2026",
      questionNumber: "Q35",
      axis: "ALG" as Axis,
      skill: "MOD" as Skill,
      difficulty: 0.25,
    },
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q40",
      axis: "ALG" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.25,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q10",
      axis: "NUM" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.3,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q6",
      axis: "NUM" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.3,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q63",
      axis: "GEO" as Axis,
      skill: "REP" as Skill,
      difficulty: 0.3,
    },
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q64",
      axis: "PROB" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.35,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q54",
      axis: "PROB" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.25,
    },
  ],

  // Stage 2: Route B - Medium difficulty for average performers
  B2: [
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q42",
      axis: "ALG" as Axis,
      skill: "MOD" as Skill,
      difficulty: 0.45,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q38",
      axis: "ALG" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q36",
      axis: "ALG" as Axis,
      skill: "MOD" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q3",
      axis: "NUM" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q22",
      axis: "NUM" as Axis,
      skill: "MOD" as Skill,
      difficulty: 0.45,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q60",
      axis: "GEO" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.45,
    },
    {
      exam: "seleccion-regular-2025",
      questionNumber: "Q55",
      axis: "PROB" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q65",
      axis: "PROB" as Axis,
      skill: "REP" as Skill,
      difficulty: 0.45,
    },
  ],

  // Stage 2: Route C - Challenging questions for high performers
  C2: [
    {
      exam: "seleccion-regular-2026",
      questionNumber: "Q59",
      axis: "ALG" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.6,
    },
    {
      exam: "seleccion-regular-2026",
      questionNumber: "Q11",
      axis: "ALG" as Axis,
      skill: "MOD" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q33",
      axis: "ALG" as Axis,
      skill: "MOD" as Skill,
      difficulty: 0.6,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q56",
      axis: "NUM" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.65,
    },
    {
      exam: "seleccion-regular-2026",
      questionNumber: "Q23",
      axis: "NUM" as Axis,
      skill: "RES" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q50",
      axis: "GEO" as Axis,
      skill: "REP" as Skill,
      difficulty: 0.55,
    },
    {
      exam: "prueba-invierno-2025",
      questionNumber: "Q61",
      axis: "PROB" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.65,
    },
    {
      exam: "prueba-invierno-2026",
      questionNumber: "Q60",
      axis: "PROB" as Axis,
      skill: "ARG" as Skill,
      difficulty: 0.55,
    },
  ],
};

/**
 * Determine route based on Stage 1 correct count
 */
export function getRoute(correctCount: number): Route {
  if (correctCount <= 3) return "A";
  if (correctCount <= 6) return "B";
  return "C";
}

/**
 * Get Stage 2 questions based on route
 */
export function getStage2Questions(route: Route): MSTQuestion[] {
  return MST_QUESTIONS[`${route}2` as keyof typeof MST_QUESTIONS];
}

/**
 * Build question ID from exam and number
 * Normalizes exam name to lowercase to match database storage
 */
export function buildQuestionId(exam: string, questionNumber: string): string {
  return `${exam.toLowerCase()}-${questionNumber}`;
}

/**
 * PAES Score calculation
 * Uses weighted scoring based on difficulty and route
 */
export function calculatePAESScore(
  route: Route,
  responses: Array<{ correct: boolean; difficulty: number }>
): { score: number; min: number; max: number; level: string } {
  const WEIGHT_LOW = 1.0;
  const WEIGHT_MEDIUM = 1.8;
  const FACTOR_ROUTE: Record<Route, number> = { A: 0.7, B: 0.85, C: 1.0 };
  const FACTOR_COVERAGE = 0.9; // 10% of atoms not inferrable

  let weightedScore = 0;
  let maxWeightedScore = 0;

  for (const response of responses) {
    const weight = response.difficulty <= 0.35 ? WEIGHT_LOW : WEIGHT_MEDIUM;
    maxWeightedScore += weight;
    if (response.correct) {
      weightedScore += weight;
    }
  }

  const normalizedScore =
    maxWeightedScore > 0 ? weightedScore / maxWeightedScore : 0;
  const paesRaw =
    100 + 900 * normalizedScore * FACTOR_ROUTE[route] * FACTOR_COVERAGE;
  const score = Math.round(paesRaw);

  // Margin of error: ±50 points
  const margin = 50;
  const min = Math.max(100, score - margin);
  const max = Math.min(1000, score + margin);

  return { score, min, max, level: getLevel(score) };
}

/**
 * Get performance level from score
 */
export function getLevel(score: number): string {
  if (score < 450) return "Muy Inicial";
  if (score < 500) return "Inicial";
  if (score < 550) return "Intermedio Bajo";
  if (score < 600) return "Intermedio";
  if (score < 650) return "Intermedio Alto";
  if (score < 700) return "Alto";
  return "Muy Alto";
}

/**
 * Calculate performance by axis
 */
export function calculateAxisPerformance(
  responses: Array<{ axis: Axis; correct: boolean }>
): Record<Axis, { correct: number; total: number; percentage: number }> {
  const result: Record<
    Axis,
    { correct: number; total: number; percentage: number }
  > = {
    ALG: { correct: 0, total: 0, percentage: 0 },
    NUM: { correct: 0, total: 0, percentage: 0 },
    GEO: { correct: 0, total: 0, percentage: 0 },
    PROB: { correct: 0, total: 0, percentage: 0 },
  };

  for (const response of responses) {
    result[response.axis].total++;
    if (response.correct) {
      result[response.axis].correct++;
    }
  }

  for (const axis of Object.keys(result) as Axis[]) {
    const data = result[axis];
    data.percentage =
      data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
  }

  return result;
}

/**
 * Calculate performance by skill
 */
export function calculateSkillPerformance(
  responses: Array<{ skill: Skill; correct: boolean }>
): Record<Skill, { correct: number; total: number; percentage: number }> {
  const result: Record<
    Skill,
    { correct: number; total: number; percentage: number }
  > = {
    RES: { correct: 0, total: 0, percentage: 0 },
    MOD: { correct: 0, total: 0, percentage: 0 },
    REP: { correct: 0, total: 0, percentage: 0 },
    ARG: { correct: 0, total: 0, percentage: 0 },
  };

  for (const response of responses) {
    result[response.skill].total++;
    if (response.correct) {
      result[response.skill].correct++;
    }
  }

  for (const skill of Object.keys(result) as Skill[]) {
    const data = result[skill];
    data.percentage =
      data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
  }

  return result;
}
