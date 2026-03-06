"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { AtomStudyView } from "./AtomStudyView";
import { PrereqScanView } from "./PrereqScanView";
import { ReviewSessionView } from "./ReviewSessionView";
import { StudySprintView } from "./StudySprintView";
import { sanitizeSprintId } from "./types";
import { useAtomStudyController } from "./useAtomStudyController";
import { usePrereqScanController } from "./usePrereqScanController";
import { useReviewSessionController } from "./useReviewSessionController";
import { useStudySprintController } from "./useStudySprintController";

function resolveNextQuestionIndex(
  itemAnswers: Array<string | null>,
  activeIndex: number
) {
  const nextUnansweredIndex = itemAnswers.findIndex(
    (answer, index) => index > activeIndex && answer === null
  );
  if (nextUnansweredIndex >= 0) return nextUnansweredIndex;
  if (activeIndex < itemAnswers.length - 1) return activeIndex + 1;
  return null;
}

/**
 * New atom-based study flow. Activated when URL has `?atom=ATOM_ID`.
 */
function AtomStudyClient({ atomId }: { atomId: string }) {
  const ctrl = useAtomStudyController(atomId);
  return <AtomStudyView ctrl={ctrl} />;
}

/**
 * Spaced-repetition review flow. Activated via `?mode=review`.
 */
function ReviewStudyClient() {
  const ctrl = useReviewSessionController();
  return <ReviewSessionView ctrl={ctrl} />;
}

/**
 * Prerequisite scan flow. Activated via `?scan=SESSION_ID`.
 */
function ScanStudyClient({ scanSessionId }: { scanSessionId: string }) {
  const ctrl = usePrereqScanController(scanSessionId);
  return <PrereqScanView ctrl={ctrl} />;
}

/**
 * Legacy sprint-based study flow. Activated when URL has
 * `?sprintId=...` or no recognised param.
 */
function SprintStudyClient({ sprintId }: { sprintId: string | null }) {
  const router = useRouter();
  const controller = useStudySprintController(sprintId);

  const nextQuestionIndex = useMemo(() => {
    if (!controller.sprint || !controller.activeItem) return null;
    if (controller.activeItem.selectedAnswer === null) return null;
    return resolveNextQuestionIndex(
      controller.sprint.items.map((i) => i.selectedAnswer),
      controller.activeIndex
    );
  }, [controller.activeIndex, controller.activeItem, controller.sprint]);

  const handleNextQuestion = useCallback(() => {
    if (nextQuestionIndex !== null)
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

export function StudySprintClient() {
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");
  if (mode === "review") {
    return <ReviewStudyClient />;
  }

  const scanSessionId = searchParams.get("scan");
  if (scanSessionId) {
    return <ScanStudyClient scanSessionId={scanSessionId} />;
  }

  const atomIdFromUrl = searchParams.get("atom");
  if (atomIdFromUrl) {
    return <AtomStudyClient atomId={atomIdFromUrl} />;
  }

  const sprintId = sanitizeSprintId(searchParams.get("sprintId") ?? "");
  return <SprintStudyClient sprintId={sprintId} />;
}
