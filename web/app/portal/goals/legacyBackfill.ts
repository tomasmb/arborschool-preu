import { type StudentGoalsPayload, type GoalOption } from "./types";

type LegacyCandidate = {
  offeringId?: unknown;
  careerName?: unknown;
  universityName?: unknown;
  nombre?: unknown;
  universidad?: unknown;
  bufferPoints?: unknown;
  scores?: unknown;
};

type BackfillResult = {
  goals: Array<{
    offeringId: string;
    priority: number;
    isPrimary: true;
    bufferPoints: number;
    bufferSource: "student";
    scores: Array<{ testCode: string; score: number; source: "student" }>;
  }>;
};

const LEGACY_KEYS = [
  "arbor:career-goal",
  "arbor:career_goal",
  "arbor:goal",
  "careerGoal",
  "selectedCareer",
  "goalAnchorCareer",
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function collectCandidateObjects(value: unknown, acc: LegacyCandidate[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectCandidateObjects(item, acc);
    }
    return;
  }

  if (!isObject(value)) {
    return;
  }

  const current = value as LegacyCandidate;
  const hasGoalLikeFields =
    typeof current.offeringId === "string" ||
    typeof current.careerName === "string" ||
    typeof current.nombre === "string";

  if (hasGoalLikeFields) {
    acc.push(current);
  }

  for (const nested of Object.values(value)) {
    collectCandidateObjects(nested, acc);
  }
}

function resolveOfferingId(
  candidate: LegacyCandidate,
  options: GoalOption[]
): string | null {
  if (typeof candidate.offeringId === "string") {
    const exists = options.some(
      (option) => option.offeringId === candidate.offeringId
    );
    if (exists) {
      return candidate.offeringId;
    }
  }

  const careerName =
    typeof candidate.careerName === "string"
      ? candidate.careerName
      : typeof candidate.nombre === "string"
        ? candidate.nombre
        : null;

  const universityName =
    typeof candidate.universityName === "string"
      ? candidate.universityName
      : typeof candidate.universidad === "string"
        ? candidate.universidad
        : null;

  if (!careerName) {
    return null;
  }

  const normalizedCareer = normalizeText(careerName);
  const normalizedUniversity =
    typeof universityName === "string" ? normalizeText(universityName) : null;

  const match = options.find((option) => {
    if (normalizeText(option.careerName) !== normalizedCareer) {
      return false;
    }

    if (!normalizedUniversity) {
      return true;
    }

    return normalizeText(option.universityName) === normalizedUniversity;
  });

  return match?.offeringId ?? null;
}

function parseScores(
  rawScores: unknown,
  option: GoalOption
): Array<{ testCode: string; score: number; source: "student" }> {
  if (!isObject(rawScores)) {
    return [];
  }

  const allowedCodes = new Set(
    option.weights.map((weight) => weight.testCode.trim().toUpperCase())
  );

  const rows: Array<{ testCode: string; score: number; source: "student" }> =
    [];

  for (const [code, rawValue] of Object.entries(rawScores)) {
    const normalizedCode = code.trim().toUpperCase();
    if (!allowedCodes.has(normalizedCode)) {
      continue;
    }

    const parsed = parseNumber(rawValue);
    if (parsed === null || parsed < 100 || parsed > 1000) {
      continue;
    }

    rows.push({
      testCode: normalizedCode,
      score: parsed,
      source: "student",
    });
  }

  return rows;
}

function parseBufferPoints(value: unknown): number {
  const parsed = parseNumber(value);
  if (parsed === null || parsed < 0) {
    return 30;
  }

  return Math.round(parsed);
}

export function readLegacyGoalBackfill(
  options: StudentGoalsPayload["options"]
): BackfillResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidateKeys = new Set(LEGACY_KEYS);
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }

    const normalized = key.toLowerCase();
    if (normalized.includes("goal") || normalized.includes("career")) {
      candidateKeys.add(key);
    }
  }

  for (const key of candidateKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    const parsed = parseJson(raw);
    if (parsed === null) {
      continue;
    }

    const candidates: LegacyCandidate[] = [];
    collectCandidateObjects(parsed, candidates);

    for (const candidate of candidates) {
      const offeringId = resolveOfferingId(candidate, options);
      if (!offeringId) {
        continue;
      }

      const option = options.find((item) => item.offeringId === offeringId);
      if (!option) {
        continue;
      }

      return {
        goals: [
          {
            offeringId,
            priority: 1,
            isPrimary: true,
            bufferPoints: parseBufferPoints(candidate.bufferPoints),
            bufferSource: "student",
            scores: parseScores(candidate.scores, option),
          },
        ],
      };
    }
  }

  return null;
}
