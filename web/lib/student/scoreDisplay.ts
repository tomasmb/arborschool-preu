/**
 * Shared score display logic — resolves which score to show
 * (personal best vs latest) consistently across dashboard & progress.
 */

export type ScoreEntry = {
  paesScoreMin: number;
  paesScoreMax: number;
  paesScoreMid: number;
};

export type DisplayScore = {
  score: number;
  min: number;
  max: number;
  isPersonalBest: boolean;
};

/**
 * Finds the score history entry with the highest mid score.
 * Returns null if the history is empty.
 */
export function findPersonalBest(
  history: ScoreEntry[]
): ScoreEntry | null {
  if (history.length === 0) return null;
  return history.reduce((best, entry) =>
    entry.paesScoreMid > best.paesScoreMid ? entry : best
  );
}

/**
 * Resolves the display score by picking the personal best when it
 * exceeds the latest snapshot score. Both the dashboard and the
 * progress page use this so the displayed "Puntaje actual" is
 * consistent across views.
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
