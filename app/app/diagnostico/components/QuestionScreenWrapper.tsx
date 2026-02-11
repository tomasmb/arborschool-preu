"use client";

import { isLocalAttempt, getStoredResponses } from "@/lib/diagnostic/storage";
import { type useDiagnosticFlow } from "../hooks/useDiagnosticFlow";
import { QuestionScreen } from "./QuestionScreen";
import { DiagnosticHeader } from "./DiagnosticHeader";
import { OfflineIndicator, TimeUpModal } from "./shared";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionScreenWrapperProps {
  flow: ReturnType<typeof useDiagnosticFlow>;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Wrapper for the question screen that composes the header,
 * question content, offline indicator, and time-up modal.
 */
export function QuestionScreenWrapper({ flow }: QuestionScreenWrapperProps) {
  const question = flow.getCurrentQuestion();
  const totalQuestions = 16;
  const currentQuestionNumber =
    flow.stage === 1 ? flow.questionIndex + 1 : 8 + flow.questionIndex + 1;
  const isOfflineMode = isLocalAttempt(flow.attemptId);
  const isOvertime = flow.timeExpiredAt !== null;
  const answeredCount = getStoredResponses().filter(
    (r) => !r.answeredAfterTimeUp
  ).length;

  return (
    <div className="min-h-screen relative">
      {/* Background decorations */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream via-white to-off-white" />
      <div
        className="fixed top-20 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        aria-hidden="true"
      />

      {/* Header with progress and timer */}
      <DiagnosticHeader
        currentQuestion={currentQuestionNumber}
        totalQuestions={totalQuestions}
        timeRemaining={flow.timeRemaining}
        stage={flow.stage}
        route={flow.route}
        isOvertime={isOvertime}
      />

      <div className="relative z-10">
        <QuestionScreen
          question={question}
          questionIndex={flow.questionIndex}
          selectedAnswer={flow.selectedAnswer}
          isDontKnow={flow.isDontKnow}
          onSelectAnswer={flow.handleSelectAnswer}
          onSelectDontKnow={flow.handleSelectDontKnow}
          onNext={flow.handleNext}
          onFatalError={flow.handleFatalError}
        />
      </div>

      {/* Offline mode indicator */}
      {isOfflineMode && <OfflineIndicator />}

      {/* Time up modal */}
      <TimeUpModal
        isOpen={flow.showTimeUpModal}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        onViewResults={flow.handleViewResultsAfterTimeUp}
        onContinue={flow.handleContinueAfterTimeUp}
      />
    </div>
  );
}
