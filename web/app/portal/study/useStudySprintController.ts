"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { trackFirstSprintStarted, trackWeeklyActive } from "@/lib/analytics";
import {
  completeStudySprint,
  createStudySprint,
  fetchStudySprint,
  submitStudySprintAnswer,
} from "./api";
import { toErrorMessage } from "../errorUtils";
import type {
  AnswerResponse,
  CompletionResponse,
  SprintData,
  SprintItem,
} from "./types";

type SprintBootstrapState = {
  loading: boolean;
  error: string | null;
  sprint: SprintData | null;
  activeIndex: number;
  setError: (message: string | null) => void;
  setSprint: Dispatch<SetStateAction<SprintData | null>>;
  setActiveIndex: Dispatch<SetStateAction<number>>;
};

function firstUnansweredIndex(items: SprintItem[]) {
  const index = items.findIndex((item) => item.selectedAnswer === null);
  return index >= 0 ? index : 0;
}

function useSprintBootstrap(
  sprintIdFromUrl: string | null
): SprintBootstrapState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);
      setError(null);
      try {
        let sprintId = sprintIdFromUrl;
        let createdSprint: Awaited<
          ReturnType<typeof createStudySprint>
        > | null = null;

        if (!sprintId) {
          createdSprint = await createStudySprint();
          sprintId = createdSprint.sprintId;
        }

        if (!sprintId) {
          throw new Error("No pudimos iniciar el sprint");
        }

        const loaded = await fetchStudySprint(sprintId);
        if (!mounted) {
          return;
        }

        if (createdSprint?.isFirstSprintStarted) {
          trackFirstSprintStarted({
            sprintId: createdSprint.sprintId,
            estimatedMinutes: createdSprint.estimatedMinutes,
            itemCount: createdSprint.itemCount,
            entryPoint: "/portal/study",
            journeyState: "activation_ready",
          });
        }

        setSprint(loaded);
        setActiveIndex(firstUnansweredIndex(loaded.items));
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(toErrorMessage(loadError, "No pudimos iniciar el sprint"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [sprintIdFromUrl]);

  return {
    loading,
    error,
    sprint,
    activeIndex,
    setError,
    setSprint,
    setActiveIndex,
  };
}

function useSelectedAnswer(activeItem: SprintItem | null) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    setSelectedAnswer(activeItem?.selectedAnswer ?? null);
  }, [activeItem]);

  return { selectedAnswer, setSelectedAnswer };
}

function buildAnsweredSprint(
  sprint: SprintData,
  payload: AnswerResponse
): { sprint: SprintData; nextUnansweredIndex: number } {
  const items = sprint.items.map((item) => {
    if (item.itemId !== payload.sprintItemId) {
      return item;
    }
    return {
      ...item,
      selectedAnswer: payload.selectedAnswer,
      isCorrect: payload.isCorrect,
    };
  });

  const answered = items.filter((item) => item.selectedAnswer !== null).length;
  const nextUnansweredIndex = items.findIndex(
    (item) => item.selectedAnswer === null
  );

  return {
    sprint: {
      ...sprint,
      progress: {
        answered,
        total: items.length,
        remaining: Math.max(0, items.length - answered),
      },
      items,
    },
    nextUnansweredIndex,
  };
}

function useAnswerAction(params: {
  sprint: SprintData | null;
  activeItem: SprintItem | null;
  selectedAnswer: string | null;
  setError: (message: string | null) => void;
  setSprint: Dispatch<SetStateAction<SprintData | null>>;
  setActiveIndex: Dispatch<SetStateAction<number>>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<AnswerResponse | null>(
    null
  );

  const submitAnswer = useCallback(async () => {
    const {
      sprint,
      activeItem,
      selectedAnswer,
      setError,
      setSprint,
      setActiveIndex,
    } = params;

    if (!sprint || !activeItem || !selectedAnswer) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = await submitStudySprintAnswer({
        sprintId: sprint.sprintId,
        sprintItemId: activeItem.itemId,
        selectedAnswer,
      });

      setLatestFeedback(payload);
      const updated = buildAnsweredSprint(sprint, payload);
      setSprint(updated.sprint);
      if (updated.nextUnansweredIndex >= 0) {
        setActiveIndex(updated.nextUnansweredIndex);
      }
    } catch (submitError) {
      setError(toErrorMessage(submitError, "No pudimos guardar tu respuesta"));
    } finally {
      setSubmitting(false);
    }
  }, [params]);

  return { submitting, latestFeedback, submitAnswer };
}

function useCompleteAction(params: {
  sprint: SprintData | null;
  setError: (message: string | null) => void;
  setSprint: Dispatch<SetStateAction<SprintData | null>>;
}) {
  const [completing, setCompleting] = useState(false);
  const [completion, setCompletion] = useState<CompletionResponse | null>(null);

  const completeSprint = useCallback(async () => {
    if (!params.sprint) {
      return;
    }

    setCompleting(true);
    params.setError(null);

    try {
      const payload = await completeStudySprint(params.sprint.sprintId);
      setCompletion(payload);
      if (
        !payload.alreadyCompleted &&
        payload.mission.completedSessions === 1
      ) {
        trackWeeklyActive({
          weekStartDate: payload.mission.weekStartDate,
          completedSessions: payload.mission.completedSessions,
          targetSessions: payload.mission.targetSessions,
          entryPoint: "/portal/study",
          journeyState: "active_learning",
        });
      }
      const refreshed = await fetchStudySprint(params.sprint.sprintId);
      params.setSprint(refreshed);
    } catch (completeError) {
      params.setError(
        toErrorMessage(completeError, "No pudimos completar el sprint")
      );
    } finally {
      setCompleting(false);
    }
  }, [params]);

  return { completing, completion, completeSprint };
}

export function useStudySprintController(sprintIdFromUrl: string | null) {
  const bootstrap = useSprintBootstrap(sprintIdFromUrl);
  const activeItem = bootstrap.sprint?.items[bootstrap.activeIndex] ?? null;
  const selection = useSelectedAnswer(activeItem);

  const answeredCount = useMemo(
    () =>
      bootstrap.sprint?.items.filter((item) => item.selectedAnswer !== null)
        .length ?? 0,
    [bootstrap.sprint]
  );

  const correctCount = useMemo(
    () =>
      bootstrap.sprint?.items.filter((item) => item.isCorrect === true)
        .length ?? 0,
    [bootstrap.sprint]
  );

  const answerAction = useAnswerAction({
    sprint: bootstrap.sprint,
    activeItem,
    selectedAnswer: selection.selectedAnswer,
    setError: bootstrap.setError,
    setSprint: bootstrap.setSprint,
    setActiveIndex: bootstrap.setActiveIndex,
  });

  const completeAction = useCompleteAction({
    sprint: bootstrap.sprint,
    setError: bootstrap.setError,
    setSprint: bootstrap.setSprint,
  });

  const isFullyAnswered =
    bootstrap.sprint !== null &&
    answeredCount >= bootstrap.sprint.items.length &&
    bootstrap.sprint.items.length > 0;

  return {
    ...bootstrap,
    activeItem,
    isFullyAnswered,
    answeredCount,
    correctCount,
    ...selection,
    ...answerAction,
    ...completeAction,
  };
}
