import { getStudentGoalsView } from "@/lib/student/goals";
import {
  ELECTIVO_TEST_CODE,
  ELECTIVO_SUB_TESTS,
} from "@/lib/student/constants";

type ScoreSource = "student" | "system" | "query";

type WeightComponent = {
  testCode: string;
  weightPercent: number;
  score: number | null;
  scoreSource: ScoreSource | null;
  contribution: number | null;
};

type GoalWithScores = {
  id: string;
  offeringId: string;
  buffer: {
    points: number;
  };
  scores: {
    testCode: string;
    score: number;
    source: string;
  }[];
};

type GoalOption = {
  offeringId: string;
  careerName: string;
  universityName: string;
  lastCutoff: number | null;
  cutoffYear: number | null;
  weights: { testCode: string; weightPercent: number }[];
};

export type StudentGoalSimulationQuery = {
  scoreOverrides: Record<string, number | null>;
  bufferPointsOverride?: number;
};

export type StudentGoalSimulationResult = {
  goalId: string;
  offeringId: string;
  offeringLabel: string;
  dataset: {
    version: string;
    source: string;
    publishedAt: Date;
  } | null;
  inputs: {
    scores: Record<string, { score: number; source: ScoreSource }>;
    bufferPoints: number;
  };
  formula: {
    components: WeightComponent[];
    weightedScore: number | null;
    requiredTests: string[];
    missingTests: string[];
    isComplete: boolean;
  };
  targets: {
    lastCutoff: number | null;
    cutoffYear: number | null;
    bufferedTarget: number | null;
  };
  admissibility: {
    deltaVsBufferedTarget: number | null;
    deltaVsLastCutoff: number | null;
    meetsBufferedTarget: boolean | null;
  };
  sensitivity: {
    testCode: string;
    increment: number;
    adjustedWeightedScore: number | null;
    weightedDelta: number | null;
    deltaVsBufferedTarget: number | null;
    deltaVsLastCutoff: number | null;
  };
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeTestCode(testCode: string): string {
  return testCode.trim().toUpperCase();
}

function resolveElectivoScore(
  scores: Map<string, { score: number; source: ScoreSource }>
): { score: number; source: ScoreSource; resolvedTest: string } | null {
  let best: { score: number; source: ScoreSource; resolvedTest: string } | null =
    null;
  for (const sub of ELECTIVO_SUB_TESTS) {
    const entry = scores.get(sub);
    if (entry && (best === null || entry.score > best.score)) {
      best = { score: entry.score, source: entry.source, resolvedTest: sub };
    }
  }
  return best;
}

function mapGoalScores(goal: GoalWithScores) {
  const byTest = new Map<string, { score: number; source: ScoreSource }>();
  for (const score of goal.scores) {
    byTest.set(normalizeTestCode(score.testCode), {
      score: score.score,
      source: score.source === "system" ? "system" : "student",
    });
  }
  return byTest;
}

function mergeScores(
  goal: GoalWithScores,
  overrides: Record<string, number | null>
): Map<string, { score: number; source: ScoreSource }> {
  const merged = mapGoalScores(goal);
  for (const [testCode, score] of Object.entries(overrides)) {
    const normalizedTestCode = normalizeTestCode(testCode);
    if (score === null) {
      merged.delete(normalizedTestCode);
      continue;
    }

    merged.set(normalizeTestCode(testCode), {
      score,
      source: "query",
    });
  }
  return merged;
}

function buildComponents(
  weights: GoalOption["weights"],
  scores: Map<string, { score: number; source: ScoreSource }>
): {
  components: WeightComponent[];
  missingTests: string[];
  weightedScore: number | null;
} {
  let weightedAccumulator = 0;
  const missingTests: string[] = [];

  const components = weights.map((weight) => {
    const testCode = normalizeTestCode(weight.testCode);

    if (testCode === ELECTIVO_TEST_CODE) {
      const resolved = resolveElectivoScore(scores);
      if (!resolved) {
        missingTests.push(testCode);
        return {
          testCode,
          weightPercent: weight.weightPercent,
          score: null,
          scoreSource: null,
          contribution: null,
        };
      }
      const contribution = round2(
        resolved.score * (weight.weightPercent / 100)
      );
      weightedAccumulator += contribution;
      return {
        testCode: `${ELECTIVO_TEST_CODE}:${resolved.resolvedTest}`,
        weightPercent: weight.weightPercent,
        score: resolved.score,
        scoreSource: resolved.source,
        contribution,
      };
    }

    const scoreEntry = scores.get(testCode);
    if (!scoreEntry) {
      missingTests.push(testCode);
      return {
        testCode,
        weightPercent: weight.weightPercent,
        score: null,
        scoreSource: null,
        contribution: null,
      };
    }

    const contribution = round2(
      scoreEntry.score * (weight.weightPercent / 100)
    );
    weightedAccumulator += contribution;
    return {
      testCode,
      weightPercent: weight.weightPercent,
      score: scoreEntry.score,
      scoreSource: scoreEntry.source,
      contribution,
    };
  });

  if (missingTests.length > 0) {
    return {
      components,
      missingTests,
      weightedScore: null,
    };
  }

  return {
    components,
    missingTests,
    weightedScore: round2(weightedAccumulator),
  };
}

function computeBufferedTarget(
  lastCutoff: number | null,
  bufferPoints: number
): number | null {
  if (lastCutoff === null) {
    return null;
  }
  return round2(lastCutoff + bufferPoints);
}

function computeDelta(
  weightedScore: number | null,
  targetScore: number | null
): number | null {
  if (weightedScore === null || targetScore === null) {
    return null;
  }
  return round2(weightedScore - targetScore);
}

function emptySensitivity(testCode: string, increment: number) {
  return {
    testCode,
    increment,
    adjustedWeightedScore: null,
    weightedDelta: null,
    deltaVsBufferedTarget: null,
    deltaVsLastCutoff: null,
  };
}

function buildSensitivity(
  option: GoalOption,
  scores: Map<string, { score: number; source: ScoreSource }>,
  increment = 10,
  testCode = "M1",
  bufferedTarget: number | null,
  lastCutoff: number | null
) {
  const normalizedTestCode = normalizeTestCode(testCode);
  const scoreToAdjust = scores.get(normalizedTestCode);

  if (!scoreToAdjust) {
    return emptySensitivity(normalizedTestCode, increment);
  }

  const adjustedScores = new Map(scores);
  adjustedScores.set(normalizedTestCode, {
    score: scoreToAdjust.score + increment,
    source: scoreToAdjust.source,
  });

  const adjusted = buildComponents(option.weights, adjustedScores);
  const current = buildComponents(option.weights, scores);

  if (adjusted.weightedScore === null || current.weightedScore === null) {
    return emptySensitivity(normalizedTestCode, increment);
  }

  return {
    testCode: normalizedTestCode,
    increment,
    adjustedWeightedScore: adjusted.weightedScore,
    weightedDelta: round2(adjusted.weightedScore - current.weightedScore),
    deltaVsBufferedTarget: computeDelta(adjusted.weightedScore, bufferedTarget),
    deltaVsLastCutoff: computeDelta(adjusted.weightedScore, lastCutoff),
  };
}

export function runGoalSimulator(params: {
  goal: GoalWithScores;
  option: GoalOption;
  dataset: StudentGoalSimulationResult["dataset"];
  query: StudentGoalSimulationQuery;
}): StudentGoalSimulationResult {
  const { goal, option, dataset, query } = params;
  const mergedScores = mergeScores(goal, query.scoreOverrides);
  const bufferPoints = query.bufferPointsOverride ?? goal.buffer.points;
  const formula = buildComponents(option.weights, mergedScores);
  const bufferedTarget = computeBufferedTarget(option.lastCutoff, bufferPoints);
  const deltaVsBufferedTarget = computeDelta(
    formula.weightedScore,
    bufferedTarget
  );
  const deltaVsLastCutoff = computeDelta(
    formula.weightedScore,
    option.lastCutoff
  );

  const scoreEntries: StudentGoalSimulationResult["inputs"]["scores"] = {};
  for (const [testCode, score] of mergedScores.entries()) {
    scoreEntries[testCode] = score;
  }

  return {
    goalId: goal.id,
    offeringId: goal.offeringId,
    offeringLabel: `${option.careerName} — ${option.universityName}`,
    dataset,
    inputs: {
      scores: scoreEntries,
      bufferPoints,
    },
    formula: {
      components: formula.components,
      weightedScore: formula.weightedScore,
      requiredTests: option.weights.map((weight) =>
        normalizeTestCode(weight.testCode)
      ),
      missingTests: formula.missingTests,
      isComplete: formula.missingTests.length === 0,
    },
    targets: {
      lastCutoff: option.lastCutoff,
      cutoffYear: option.cutoffYear,
      bufferedTarget,
    },
    admissibility: {
      deltaVsBufferedTarget,
      deltaVsLastCutoff,
      meetsBufferedTarget:
        deltaVsBufferedTarget === null ? null : deltaVsBufferedTarget >= 0,
    },
    sensitivity: buildSensitivity(
      option,
      mergedScores,
      10,
      "M1",
      bufferedTarget,
      option.lastCutoff
    ),
  };
}

export async function getStudentGoalSimulation(
  userId: string,
  goalId: string,
  query: StudentGoalSimulationQuery
) {
  const view = await getStudentGoalsView(userId);
  const goal = view.goals.find((item) => item.id === goalId);

  if (!goal) {
    return null;
  }

  const option = view.options.find(
    (item) => item.offeringId === goal.offeringId
  );
  if (!option) {
    return null;
  }

  return runGoalSimulator({
    goal,
    option,
    dataset: view.dataset,
    query,
  });
}
