"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  completeStudySprint,
  createStudySprint,
  fetchStudySprint,
  submitStudySprintAnswer,
} from "./api";
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
        const sprintId = sprintIdFromUrl ?? (await createStudySprint());
        const loaded = await fetchStudySprint(sprintId);
        if (!mounted) {
          return;
        }
        setSprint(loaded);
        setActiveIndex(firstUnansweredIndex(loaded.items));
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo iniciar el sprint"
        );
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
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar la respuesta"
      );
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
      const refreshed = await fetchStudySprint(params.sprint.sprintId);
      params.setSprint(refreshed);
    } catch (completeError) {
      params.setError(
        completeError instanceof Error
          ? completeError.message
          : "No se pudo completar el sprint"
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
