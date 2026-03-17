import { staticFile } from "remotion";

/**
 * Google Fonts loaded via @font-face for Remotion rendering.
 * We fetch them at render-time so no network dependency in final output.
 *
 * To use: include <FontStyles /> in your top-level composition.
 */

const INTER_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
const MERRIWEATHER_URL =
  "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap";

export function fontStyleTag(): string {
  return `
    @import url('${INTER_URL}');
    @import url('${MERRIWEATHER_URL}');
  `;
}
