export type StudySprintCreatePayload = {
  sprintId: string;
  estimatedMinutes: number;
  itemCount: number;
  isFirstSprintStarted: boolean;
};

export type StudySprintItemPayload = {
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

export type StudySprintPayload = {
  sprintId: string;
  status: string;
  estimatedMinutes: number;
  progress: {
    answered: number;
    total: number;
    remaining: number;
  };
  items: StudySprintItemPayload[];
};

export type StudySprintAnswerPayload = {
  sprintItemId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  progress: StudySprintPayload["progress"] | null;
};

export type StudyMissionPayload = {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  targetSessions: number;
  completedSessions: number;
  status: string;
};

export type StudySprintStreakPayload = {
  currentStreak: number;
  maxStreak: number;
};

export type StudySprintCompletionPayload = {
  sprintId: string;
  status: string;
  alreadyCompleted: boolean;
  mission: StudyMissionPayload;
  streak: StudySprintStreakPayload;
};
