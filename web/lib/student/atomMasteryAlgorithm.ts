/**
 * Atom Mastery Algorithm — Types, constants, and pure state-transition logic.
 *
 * Separated from atomMasteryEngine.ts to keep both files under 500 lines.
 * The engine handles DB operations; this module is the pure algorithm.
 */

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type SessionDifficulty = "easy" | "medium" | "hard";
export type SessionStatus =
  | "lesson"
  | "in_progress"
  | "mastered"
  | "failed"
  | "abandoned";

export type AtomSessionPayload = {
  sessionId: string;
  atomId: string;
  atomTitle: string;
  hasLesson: boolean;
  lessonHtml: string | null;
  status: SessionStatus;
  attemptNumber: number;
};

export type NextQuestionPayload = {
  responseId: string;
  questionHtml: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
  difficultyLevel: SessionDifficulty;
  position: number;
  totalQuestions: number;
};

export type AnswerResultPayload = {
  sessionId: string;
  responseId: string;
  isCorrect: boolean;
  correctAnswer: string;
  status: SessionStatus;
  currentDifficulty: SessionDifficulty;
  consecutiveCorrect: number;
  totalQuestions: number;
  correctQuestions: number;
  selectedFeedbackHtml?: string;
  correctFeedbackHtml?: string;
  generalFeedbackHtml?: string;
};

export type SessionResponsePayload = {
  responseId: string;
  position: number;
  questionHtml: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
  difficultyLevel: string;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  correctAnswer: string | null;
};

export type SessionStatePayload = {
  sessionId: string;
  atomId: string;
  atomTitle: string;
  status: SessionStatus;
  currentDifficulty: SessionDifficulty;
  totalQuestions: number;
  correctQuestions: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  attemptNumber: number;
  hasLesson: boolean;
  lessonViewedAt: Date | null;
  responses: SessionResponsePayload[];
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_ATTEMPTS = 3;
export const MAX_QUESTIONS = 20;

const MASTERY_CONSECUTIVE = 3;
const MASTERY_HARD_MIN = 2;
const FAIL_CONSECUTIVE_WRONG = 3;
const FAIL_MIN_Q_FOR_ACCURACY = 10;
const FAIL_ACCURACY_THRESHOLD = 0.7;
const STREAK_TO_ADVANCE = 2;
const WRONG_TO_REGRESS = 2;

type QuestionDifficulty = "low" | "medium" | "high";

/** Maps session difficulty → question.difficultyLevel enum */
export const DIFF_MAP: Record<SessionDifficulty, QuestionDifficulty> = {
  easy: "low",
  medium: "medium",
  hard: "high",
};

/** Fallback order when no questions exist at the target difficulty */
export const DIFF_FALLBACKS: Record<QuestionDifficulty, QuestionDifficulty[]> =
  {
    low: ["medium", "high"],
    medium: ["low", "high"],
    high: ["medium", "low"],
  };

// ============================================================================
// SESSION STATE FIELDS (internal shape for the algorithm)
// ============================================================================

export type SessionStateFields = {
  status: SessionStatus;
  currentDifficulty: SessionDifficulty;
  easyStreak: number;
  mediumStreak: number;
  hardStreak: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  hardCorrectInStreak: number;
  totalQuestions: number;
  correctQuestions: number;
};

// ============================================================================
// CORE MASTERY ALGORITHM (pure function)
//
// Mastery:  3 consecutive correct, 2+ at hard
// Failure:  3 consecutive wrong | <70% after 10 q | 20 q without mastery
// Advance:  2 correct at current level → level up
// Regress:  2 consecutive wrong → level down
// ============================================================================

export function computeUpdatedState(
  state: SessionStateFields,
  isCorrect: boolean,
  difficulty: SessionDifficulty
): SessionStateFields {
  const s = { ...state };
  s.totalQuestions += 1;

  if (isCorrect) {
    s.correctQuestions += 1;
    s.consecutiveCorrect += 1;
    s.consecutiveIncorrect = 0;

    if (difficulty === "easy") s.easyStreak += 1;
    else if (difficulty === "medium") s.mediumStreak += 1;
    else s.hardStreak += 1;

    if (difficulty === "hard") s.hardCorrectInStreak += 1;

    if (
      s.consecutiveCorrect >= MASTERY_CONSECUTIVE &&
      s.hardCorrectInStreak >= MASTERY_HARD_MIN
    ) {
      s.status = "mastered";
    }

    if (s.status !== "mastered") {
      if (difficulty === "easy" && s.easyStreak >= STREAK_TO_ADVANCE) {
        s.currentDifficulty = "medium";
        s.mediumStreak = 0;
      } else if (
        difficulty === "medium" &&
        s.mediumStreak >= STREAK_TO_ADVANCE
      ) {
        s.currentDifficulty = "hard";
        s.hardStreak = 0;
      }
    }
  } else {
    s.consecutiveCorrect = 0;
    s.hardCorrectInStreak = 0;
    s.consecutiveIncorrect += 1;

    if (difficulty === "easy") s.easyStreak = 0;
    else if (difficulty === "medium") s.mediumStreak = 0;
    else s.hardStreak = 0;

    if (s.consecutiveIncorrect >= FAIL_CONSECUTIVE_WRONG) {
      s.status = "failed";
    }

    if (
      s.status !== "failed" &&
      s.totalQuestions >= FAIL_MIN_Q_FOR_ACCURACY &&
      s.correctQuestions / s.totalQuestions < FAIL_ACCURACY_THRESHOLD
    ) {
      s.status = "failed";
    }

    // Regress difficulty; preserve consecutiveIncorrect for the 3-fail check
    if (s.status !== "failed" && s.consecutiveIncorrect >= WRONG_TO_REGRESS) {
      if (s.currentDifficulty === "hard") s.currentDifficulty = "medium";
      else if (s.currentDifficulty === "medium") s.currentDifficulty = "easy";
    }
  }

  if (s.totalQuestions >= MAX_QUESTIONS && s.status === "in_progress") {
    s.status = "failed";
  }

  return s;
}
