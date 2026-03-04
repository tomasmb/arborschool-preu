export interface StoredResponse {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  stage: number;
  questionIndex: number;
  answeredAt: string;
}

export interface TopRouteData {
  name: string;
  questionsUnlocked: number;
  pointsGain: number;
}

export interface ProfilingData {
  paesGoal?: string;
  paesDate?: string;
  inPreu?: boolean;
}

export interface DiagnosticData {
  responses: StoredResponse[];
  results: {
    paesMin: number;
    paesMax: number;
    level: string;
    route: string;
    totalCorrect: number;
    performanceTier?: string;
    topRoute?: TopRouteData;
  } | null;
}

export interface ProfileRequestBody {
  userId?: string;
  attemptId: string | null;
  profilingData?: ProfilingData;
  atomResults?: Array<{ atomId: string; mastered: boolean }>;
  diagnosticData?: DiagnosticData;
}

export type ResultsSnapshot = NonNullable<DiagnosticData["results"]>;
