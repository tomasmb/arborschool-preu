"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { StudySprintView } from "./StudySprintView";
import { sanitizeSprintId } from "./types";
import { useStudySprintController } from "./useStudySprintController";

function resolveNextQuestionIndex(
  itemAnswers: Array<string | null>,
  activeIndex: number
) {
  const nextUnansweredIndex = itemAnswers.findIndex(
    (answer, index) => index > activeIndex && answer === null
  );
  if (nextUnansweredIndex >= 0) {
    return nextUnansweredIndex;
  }

  if (activeIndex < itemAnswers.length - 1) {
    return activeIndex + 1;
  }

  return null;
}

export function StudySprintClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sprintIdFromUrl = sanitizeSprintId(searchParams.get("sprintId") ?? "");

  const controller = useStudySprintController(sprintIdFromUrl);
  const nextQuestionIndex = useMemo(() => {
    if (!controller.sprint || !controller.activeItem) {
      return null;
    }
    if (controller.activeItem.selectedAnswer === null) {
      return null;
    }

    return resolveNextQuestionIndex(
      controller.sprint.items.map((item) => item.selectedAnswer),
      controller.activeIndex
    );
  }, [controller.activeIndex, controller.activeItem, controller.sprint]);

  const handleNextQuestion = useCallback(() => {
    if (nextQuestionIndex === null) {
      return;
    }

    controller.setActiveIndex(nextQuestionIndex);
  }, [controller, nextQuestionIndex]);

  return (
    <StudySprintView
      loading={controller.loading}
      error={controller.error}
      sprint={controller.sprint}
      completion={controller.completion}
      answeredCount={controller.answeredCount}
      correctCount={controller.correctCount}
      activeItem={controller.activeItem}
      selectedAnswer={controller.selectedAnswer}
      latestFeedbackItemId={controller.latestFeedback?.sprintItemId ?? null}
      latestFeedbackIsCorrect={controller.latestFeedback?.isCorrect ?? false}
      latestFeedbackAnswer={controller.latestFeedback?.correctAnswer ?? ""}
      submitting={controller.submitting}
      completing={controller.completing}
      isFullyAnswered={controller.isFullyAnswered}
      canGoToNextQuestion={nextQuestionIndex !== null}
      onSelectAnswer={controller.setSelectedAnswer}
      onSubmitAnswer={() => void controller.submitAnswer()}
      onNextQuestion={handleNextQuestion}
      onCompleteSprint={() => void controller.completeSprint()}
      onCreateAnother={() => router.refresh()}
    />
  );
}
