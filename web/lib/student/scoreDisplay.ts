/**
 * Shared score display logic — resolves which score to show
 * (personal best vs latest) consistently across dashboard & progress.
 *
 * Full tests (60 questions) are always preferred over diagnostics
 * (16 questions) because they provide a much more reliable estimate.
 */

export type ScoreEntry = {
  paesScoreMin: number;
  paesScoreMax: number;
  paesScoreMid: number;
  type?: "short_diagnostic" | "full_test";
};

export type DisplayScore = {
  score: number;
  min: number;
  max: number;
  isPersonalBest: boolean;
};

/**
 * Finds the best score from history, preferring full tests.
 *
 * 1. If any full tests exist, picks the best full test score.
 * 2. Otherwise falls back to the best score from any type.
 */
export function findPersonalBest(
  history: ScoreEntry[]
): ScoreEntry | null {
  if (history.length === 0) return null;

  const fullTests = history.filter((e) => e.type === "full_test");
  const pool = fullTests.length > 0 ? fullTests : history;

  return pool.reduce((best, entry) =>
    entry.paesScoreMid > best.paesScoreMid ? entry : best
  );
}

/**
 * Resolves the display score by picking the personal best when it
 * exceeds the latest snapshot score. Full test scores always take
 * priority over diagnostic scores.
 */
export function resolveDisplayScore(
  snapshot: { paesScoreMin: number; paesScoreMax: number },
  history: ScoreEntry[]
): DisplayScore {
  const latestMid = Math.round(
    (snapshot.paesScoreMin + snapshot.paesScoreMax) / 2
  );

  const best = findPersonalBest(history);
  const isPersonalBest =
    best !== null && best.paesScoreMid > latestMid;

  return {
    score: isPersonalBest ? best.paesScoreMid : latestMid,
    min: isPersonalBest ? best.paesScoreMin : snapshot.paesScoreMin,
    max: isPersonalBest ? best.paesScoreMax : snapshot.paesScoreMax,
    isPersonalBest,
  };
}
