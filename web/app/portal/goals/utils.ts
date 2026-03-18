import {
  ELECTIVO_SUB_TESTS,
  ELECTIVO_TEST_CODE,
} from "@/lib/student/constants";
import { GoalDraft, GoalOption, StudentGoal } from "./types";

const TEST_LABELS: Record<string, string> = {
  NEM: "NEM (Notas)",
  RANKING: "Ranking",
  CL: "Comprensión Lectora",
  M1: "Matemática 1",
  M2: "Matemática 2",
  CIENCIAS: "Ciencias",
  HISTORIA: "Historia y Cs. Sociales",
  ELECTIVO: "Electivo (Cs. o Hist.)",
};

export function testLabel(code: string): string {
  const upper = code.trim().toUpperCase();
  if (upper.startsWith(`${ELECTIVO_TEST_CODE}:`)) {
    const resolved = upper.split(":")[1];
    const sub = TEST_LABELS[resolved] ?? resolved;
    return `Electivo (${sub})`;
  }
  return TEST_LABELS[upper] ?? code;
}

export function isElectivoWeight(testCode: string): boolean {
  return normalizeTestCode(testCode) === ELECTIVO_TEST_CODE;
}

export function normalizeTestCode(testCode: string): string {
  return testCode.trim().toUpperCase();
}

export function formatNumber(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toDraft(goal: StudentGoal, option?: GoalOption): GoalDraft {
  const scores: Record<string, string> = {};

  const weights = option?.weights ?? [];
  for (const weight of weights) {
    const testCode = normalizeTestCode(weight.testCode);

    if (testCode === ELECTIVO_TEST_CODE) {
      for (const sub of ELECTIVO_SUB_TESTS) {
        const existing = goal.scores.find(
          (s) => normalizeTestCode(s.testCode) === sub
        );
        scores[sub] = existing ? String(existing.score) : "";
      }
      continue;
    }

    const existing = goal.scores.find(
      (s) => normalizeTestCode(s.testCode) === testCode
    );
    scores[testCode] = existing ? String(existing.score) : "";
  }

  return {
    bufferPoints: goal.buffer.points,
    scores,
  };
}
