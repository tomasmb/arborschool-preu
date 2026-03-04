"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { StudySprintView } from "./StudySprintView";
import { sanitizeSprintId } from "./types";
import { useStudySprintController } from "./useStudySprintController";

export function StudySprintClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sprintIdFromUrl = sanitizeSprintId(searchParams.get("sprintId") ?? "");

  const controller = useStudySprintController(sprintIdFromUrl);

  const handleNextQuestion = useCallback(() => {
    if (!controller.sprint) {
      return;
    }

    const nextIndex = Math.min(
      controller.activeIndex + 1,
      controller.sprint.items.length - 1
    );
    controller.setActiveIndex(nextIndex);
  }, [controller]);

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
      onSelectAnswer={controller.setSelectedAnswer}
      onSubmitAnswer={() => void controller.submitAnswer()}
      onNextQuestion={handleNextQuestion}
      onCompleteSprint={() => void controller.completeSprint()}
      onCreateAnother={() => router.refresh()}
    />
  );
}
