export type ApiErrorPayload =
  | string
  | {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiErrorPayload;
    };

export type SprintCreateData = {
  sprintId: string;
  estimatedMinutes: number;
  itemCount: number;
};

export type SprintItem = {
  itemId: string;
  position: number;
  atomId: string;
  atomTitle: string;
  questionId: string;
  questionHtml: string;
  options: { letter: string; text: string }[];
  selectedAnswer: string | null;
  isCorrect: boolean | null;
};

export type SprintData = {
  sprintId: string;
  status: string;
  estimatedMinutes: number;
  progress: {
    answered: number;
    total: number;
    remaining: number;
  };
  items: SprintItem[];
};

export type AnswerResponse = {
  sprintItemId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  progress: SprintData["progress"] | null;
};

export type CompletionResponse = {
  sprintId: string;
  status: string;
  alreadyCompleted: boolean;
  mission: {
    id: string;
    weekStartDate: string;
    weekEndDate: string;
    targetSessions: number;
    completedSessions: number;
    status: string;
  };
};

export function resolveErrorMessage(
  payload: ApiEnvelope<unknown>,
  fallback: string
) {
  if (payload.success) {
    return fallback;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return payload.error.message;
}

export function sanitizeSprintId(value: string): string | null {
  if (!value) {
    return null;
  }

  return /^[a-f0-9-]{36}$/i.test(value) ? value : null;
}
