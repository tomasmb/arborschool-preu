/**
 * Design tokens mirroring web/app/globals.css
 * Keep in sync when the app's visual identity changes.
 */

export const colors = {
  primary: "#0b3a5b",
  primaryLight: "#134b73",
  primaryDark: "#072a42",
  charcoal: "#1a1d1e",
  coolGray: "#64748b",
  lightGray: "#94a3b8",
  white: "#ffffff",
  offWhite: "#f1f5f9",
  lightBg: "#e2e8f0",
  cream: "#fffbf5",
  accent: "#d97706",
  accentLight: "#f59e0b",
  accentDark: "#b45309",
  success: "#059669",
  error: "#dc2626",
} as const;

export const fonts = {
  sans: "Inter, system-ui, -apple-system, sans-serif",
  serif: "Merriweather, Georgia, serif",
} as const;

export const VIDEO = {
  WIDTH: 1920,
  HEIGHT: 1080,
  FPS: 30,
} as const;

/**
 * Scene timeline — each entry defines a segment of the video.
 *
 * Zoom configs are intentional:
 *   - originX/Y = the area of interest (what the viewer should focus on)
 *   - scale = how close we pull in (1.3-1.5 for detail, 1.15-1.25 for context)
 *   - startPct = when zoom begins (lower = more time spent zoomed in)
 */
export const SCENES = [
  {
    id: "card-intro",
    type: "card" as const,
    duration: 3.5,
    bg: "cream" as const,
    line1: "La nueva forma de aprender",
    line2: "ya esta aqui.",
    accentWord: null,
  },
  // Planning: zoom into the autocomplete form area
  {
    id: "clip-planning",
    type: "clip" as const,
    duration: 8,
    src: "clips/01-planning.webm",
    zoom: { scale: 1.45, originX: 0.4, originY: 0.32, startPct: 0.12 },
  },
  {
    id: "card-diagnostic",
    type: "card" as const,
    duration: 3,
    bg: "navy" as const,
    line1: "Diagnostico adaptativo.",
    line2: "En 15 minutos sabemos donde estas.",
    accentWord: null,
  },
  // Diagnostic: zoom into the answer options being selected
  {
    id: "clip-diagnostic",
    type: "clip" as const,
    duration: 8,
    src: "clips/02-diagnostic.webm",
    zoom: { scale: 1.35, originX: 0.5, originY: 0.55, startPct: 0.25 },
  },
  {
    id: "card-path",
    type: "card" as const,
    duration: 3,
    bg: "cream" as const,
    line1: "Tu camino personalizado.",
    line2: "205 conceptos en el orden exacto.",
    accentWord: null,
  },
  // Dashboard: gentle zoom into score + learning path area
  {
    id: "clip-dashboard",
    type: "clip" as const,
    duration: 9,
    src: "clips/03-dashboard.webm",
    zoom: { scale: 1.2, originX: 0.5, originY: 0.4, startPct: 0.15 },
  },
  {
    id: "card-gap",
    type: "card" as const,
    duration: 3,
    bg: "navy" as const,
    line1: "Cada concepto, una mini-clase.",
    line2: "Aprende, practica, domina.",
    accentWord: null,
  },
  // Study: zoom into the lesson header and content
  {
    id: "clip-study",
    type: "clip" as const,
    duration: 8,
    src: "clips/04-study-lesson.webm",
    zoom: { scale: 1.35, originX: 0.5, originY: 0.3, startPct: 0.2 },
  },
  {
    id: "card-sr",
    type: "card" as const,
    duration: 3,
    bg: "cream" as const,
    line1: "Repaso espaciado inteligente.",
    line2: "Lo que dominas, se queda.",
    accentWord: null,
  },
  // Review: zoom into the answer feedback area
  {
    id: "clip-review",
    type: "clip" as const,
    duration: 7,
    src: "clips/07-review.webm",
    zoom: { scale: 1.3, originX: 0.5, originY: 0.6, startPct: 0.4 },
  },
  {
    id: "card-test",
    type: "card" as const,
    duration: 3,
    bg: "navy" as const,
    line1: "60 preguntas. Tu puntaje real.",
    line2: "Test completo PAES M1.",
    accentWord: null,
  },
  // Full test: zoom into the question navigator grid
  {
    id: "clip-full-test",
    type: "clip" as const,
    duration: 8,
    src: "clips/05-full-test.webm",
    zoom: { scale: 1.35, originX: 0.35, originY: 0.35, startPct: 0.35 },
  },
  {
    id: "card-progress",
    type: "card" as const,
    duration: 3,
    bg: "cream" as const,
    line1: "Tu avance. Real.",
    line2: "Proyeccion basada en datos.",
    accentWord: null,
  },
  // Progress: zoom into the trajectory chart
  {
    id: "clip-progress",
    type: "clip" as const,
    duration: 9,
    src: "clips/08-progress.webm",
    zoom: { scale: 1.3, originX: 0.5, originY: 0.5, startPct: 0.2 },
  },
  {
    id: "end-card",
    type: "end" as const,
    duration: 4,
  },
] as const;

export const TOTAL_DURATION_SEC = SCENES.reduce(
  (sum, s) => sum + s.duration,
  0
);
export const TOTAL_DURATION_FRAMES = Math.round(
  TOTAL_DURATION_SEC * VIDEO.FPS
);

export function getSceneStartFrame(index: number): number {
  let frame = 0;
  for (let i = 0; i < index; i++) {
    frame += Math.round(SCENES[i].duration * VIDEO.FPS);
  }
  return frame;
}
