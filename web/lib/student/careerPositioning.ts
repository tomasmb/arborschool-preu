/**
 * Career Positioning Engine
 *
 * Computes how a student's general score targets + profile estimates
 * position them relative to any career offering's weighted admission
 * formula and cutoff. Replaces the per-goal simulator with a
 * student-centric approach.
 */

import {
  ELECTIVO_TEST_CODE,
  round2,
  normalizeTestCode,
  resolveElectivoFromMap,
} from "@/lib/student/constants";
import type { ScoreTargetRow, ProfileScoreRow } from "./goals.read";

type OfferingOption = {
  offeringId: string;
  careerName: string;
  universityName: string;
  location: string | null;
  lastCutoff: number | null;
  cutoffYear: number | null;
  weights: { testCode: string; weightPercent: number }[];
};

export type PositioningStatus = "above" | "near" | "below" | "incomplete";

export type WeightBreakdownItem = {
  testCode: string;
  weightPercent: number;
  score: number | null;
  contribution: number | null;
};

export type CareerPositionResult = {
  offeringId: string;
  careerName: string;
  universityName: string;
  location: string | null;
  weightedScore: number | null;
  lastCutoff: number | null;
  cutoffYear: number | null;
  margin: number | null;
  status: PositioningStatus;
  missingTests: string[];
  breakdown: WeightBreakdownItem[];
};

/**
 * Builds a unified score map from PAES targets + profile estimates.
 * Profile scores (NEM, RANKING) are keyed by their score type.
 */
function buildScoreMap(
  scoreTargets: ScoreTargetRow[],
  profileScores: ProfileScoreRow[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of scoreTargets) {
    map.set(normalizeTestCode(t.testCode), t.score);
  }
  for (const p of profileScores) {
    map.set(normalizeTestCode(p.scoreType), p.score);
  }
  return map;
}

/**
 * Computes career positioning for a single offering against the
 * student's score targets and profile estimates.
 */
export function computeCareerPosition(
  option: OfferingOption,
  scores: Map<string, number>
): CareerPositionResult {
  let weightedAccumulator = 0;
  const missingTests: string[] = [];
  const breakdown: WeightBreakdownItem[] = [];

  for (const weight of option.weights) {
    const testCode = normalizeTestCode(weight.testCode);

    if (testCode === ELECTIVO_TEST_CODE) {
      const resolved = resolveElectivoFromMap(scores);
      if (resolved === null) {
        missingTests.push(testCode);
        breakdown.push({
          testCode,
          weightPercent: weight.weightPercent,
          score: null,
          contribution: null,
        });
        continue;
      }
      const contribution = round2(resolved * (weight.weightPercent / 100));
      weightedAccumulator += contribution;
      breakdown.push({
        testCode,
        weightPercent: weight.weightPercent,
        score: resolved,
        contribution,
      });
      continue;
    }

    const score = scores.get(testCode);
    if (score === undefined) {
      missingTests.push(testCode);
      breakdown.push({
        testCode,
        weightPercent: weight.weightPercent,
        score: null,
        contribution: null,
      });
      continue;
    }

    const contribution = round2(score * (weight.weightPercent / 100));
    weightedAccumulator += contribution;
    breakdown.push({
      testCode,
      weightPercent: weight.weightPercent,
      score,
      contribution,
    });
  }

  const weightedScore =
    missingTests.length === 0 ? round2(weightedAccumulator) : null;
  const margin =
    weightedScore !== null && option.lastCutoff !== null
      ? round2(weightedScore - option.lastCutoff)
      : null;

  let status: PositioningStatus;
  if (missingTests.length > 0) {
    status = "incomplete";
  } else if (margin === null) {
    status = "incomplete";
  } else if (margin > 0) {
    status = "above";
  } else if (margin >= -20) {
    status = "near";
  } else {
    status = "below";
  }

  return {
    offeringId: option.offeringId,
    careerName: option.careerName,
    universityName: option.universityName,
    location: option.location,
    weightedScore,
    lastCutoff: option.lastCutoff,
    cutoffYear: option.cutoffYear,
    margin,
    status,
    missingTests,
    breakdown,
  };
}

/**
 * Computes career positioning for multiple offerings at once.
 */
export function computeCareerPositions(
  options: OfferingOption[],
  scoreTargets: ScoreTargetRow[],
  profileScores: ProfileScoreRow[]
): CareerPositionResult[] {
  const scores = buildScoreMap(scoreTargets, profileScores);
  return options.map((option) => computeCareerPosition(option, scores));
}

/**
 * Suggests M1 target based on a set of career interests.
 * Takes the highest needed M1 (from cutoff) among provided offerings,
 * adds a 30-point safety margin, and clamps to 100–1000.
 */
export function suggestM1Target(
  options: OfferingOption[],
  scoreTargets: ScoreTargetRow[],
  profileScores: ProfileScoreRow[],
  safetyMargin = 30
): number | null {
  const scores = buildScoreMap(scoreTargets, profileScores);

  let highestNeeded: number | null = null;

  for (const option of options) {
    if (option.lastCutoff === null) continue;

    const m1Weight = option.weights.find(
      (w) => normalizeTestCode(w.testCode) === "M1"
    );
    if (!m1Weight || m1Weight.weightPercent === 0) continue;

    const target = option.lastCutoff + safetyMargin;

    let nonM1Sum = 0;
    let hasMissing = false;
    for (const weight of option.weights) {
      const tc = normalizeTestCode(weight.testCode);
      if (tc === "M1") continue;

      if (tc === ELECTIVO_TEST_CODE) {
        const resolved = resolveElectivoFromMap(scores);
        if (resolved === null) {
          hasMissing = true;
          break;
        }
        nonM1Sum += resolved * (weight.weightPercent / 100);
        continue;
      }

      const score = scores.get(tc);
      if (score === undefined) {
        hasMissing = true;
        break;
      }
      nonM1Sum += score * (weight.weightPercent / 100);
    }

    if (hasMissing) continue;

    const m1Fraction = m1Weight.weightPercent / 100;
    const rawNeeded = (target - nonM1Sum) / m1Fraction;
    const clamped = Math.round(Math.max(100, Math.min(1000, rawNeeded)));

    if (highestNeeded === null || clamped > highestNeeded) {
      highestNeeded = clamped;
    }
  }

  return highestNeeded;
}

/**
 * Filters options to those matching career interest offering IDs
 * and computes positioning for each. Shared by the objectives API
 * route and progressTargets.
 */
export function computeInterestPositions(
  careerInterests: { offeringId: string }[],
  allOptions: OfferingOption[],
  scoreTargets: ScoreTargetRow[],
  profileScores: ProfileScoreRow[]
): CareerPositionResult[] {
  const interestIds = new Set(careerInterests.map((ci) => ci.offeringId));
  const filtered = allOptions.filter((o) => interestIds.has(o.offeringId));
  return computeCareerPositions(filtered, scoreTargets, profileScores);
}
