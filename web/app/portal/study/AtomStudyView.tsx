"use client";

import type { SessionDifficulty } from "@/lib/student/atomMasteryAlgorithm";
import type {
  NextQuestionPayload,
  AnswerResultPayload,
} from "@/lib/student/atomMasteryAlgorithm";
import { MathContent } from "@/lib/qti/MathRenderer";
import { FeedbackCard } from "@/lib/qti/FeedbackCard";
import { ErrorStatePanel, UpgradePrompt } from "../components";
import { AtomLessonView } from "./AtomLessonView";
import { AtomResultPanel } from "./AtomResultPanel";
import { MasteryMeter } from "./MasteryMeter";
import {
  HabitGuardBanner,
  type HabitGuardSuggestion,
} from "./HabitGuardBanner";
import type { useAtomStudyController } from "./useAtomStudyController";

type Controller = ReturnType<typeof useAtomStudyController>;

/* ================================================================
   Skeleton
   ================================================================ */

function AtomStudySkeleton() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border border-gray-200 bg-white
          p-5 animate-pulse"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full" />
      </div>
      <div
        className="rounded-2xl border border-gray-200 bg-white
          p-5 animate-pulse space-y-4"
      >
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-20 w-full bg-gray-100 rounded-lg" />
        <div className="space-y-2">
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Difficulty badge
   ================================================================ */

const DIFFICULTY_CONFIG: Record<
  SessionDifficulty,
  { label: string; color: string }
> = {
  easy: { label: "Fácil", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medio", color: "bg-amber-100 text-amber-700" },
  hard: { label: "Difícil", color: "bg-rose-100 text-rose-700" },
};

function DifficultyBadge({ difficulty }: { difficulty: SessionDifficulty }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={`inline-block text-[11px] uppercase tracking-wider
        font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

/* ================================================================
   Question card (used for both question & feedback phases)
   ================================================================ */

type AtomQuestionCardProps = {
  question: NextQuestionPayload;
  difficulty: SessionDifficulty;
  selectedAnswer: string | null;
  answerResult: AnswerResultPayload | null;
  submitting: boolean;
  canAdvance: boolean;
  onSelectAnswer: (letter: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onViewSolution: () => void;
};

function AtomQuestionCard({
  question,
  difficulty,
  selectedAnswer,
  answerResult,
  submitting,
  canAdvance,
  onSelectAnswer,
  onSubmit,
  onNext,
  onViewSolution,
}: AtomQuestionCardProps) {
  const hasFeedback = answerResult !== null;

  return (
    <div className="space-y-4">
      <section
        className="rounded-2xl border border-gray-200 bg-white
          p-5 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className="text-xs uppercase tracking-wide
              text-gray-500 font-medium"
          >
            Pregunta {question.position}
          </p>
          <DifficultyBadge difficulty={difficulty} />
        </div>

        <MathContent
          html={question.questionHtml}
          className="prose prose-sm max-w-none text-gray-800"
        />

        <div className="grid gap-2">
          {question.options.map((option) => {
            const checked = selectedAnswer === option.letter;
            const isCorrectAnswer =
              hasFeedback && answerResult.correctAnswer === option.letter;
            const isWrongSelection =
              hasFeedback && checked && !answerResult.isCorrect;

            let optionStyle = "border-gray-200 hover:bg-gray-50";
            let feedbackAnim = "";
            if (isCorrectAnswer && hasFeedback) {
              optionStyle = "border-emerald-300 bg-emerald-50 text-emerald-800";
              feedbackAnim = "animate-correct-pulse";
            } else if (isWrongSelection) {
              optionStyle = "border-red-300 bg-red-50 text-red-800";
              feedbackAnim = "animate-shake";
            } else if (checked) {
              optionStyle = "border-primary bg-primary/10 text-primary";
            }

            return (
              <button
                key={option.letter}
                type="button"
                onClick={() => !hasFeedback && onSelectAnswer(option.letter)}
                disabled={hasFeedback}
                className={[
                  "rounded-xl border-2 px-4 py-3 text-left text-sm",
                  "transition-all duration-200 flex items-center gap-3",
                  "active:scale-[0.98]",
                  optionStyle,
                  feedbackAnim,
                  hasFeedback ? "cursor-default" : "",
                ].join(" ")}
              >
                <OptionCircle
                  letter={option.letter}
                  checked={checked}
                  isCorrect={isCorrectAnswer && hasFeedback}
                  isWrong={isWrongSelection}
                />
                <MathContent html={option.text} className="flex-1" />
              </button>
            );
          })}
        </div>

        {/* Submit button (no feedback yet) */}
        {!hasFeedback && (
          <>
            <div className="hidden sm:flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !selectedAnswer}
                className="btn-primary text-sm disabled:opacity-60"
              >
                {submitting ? "Guardando..." : "Responder"}
              </button>
            </div>
            <div
              className="fixed bottom-0 inset-x-0 p-4 bg-white/90
                backdrop-blur border-t border-gray-100
                safe-area-bottom sm:hidden z-30"
            >
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !selectedAnswer}
                className="btn-primary w-full text-sm disabled:opacity-60"
              >
                {submitting ? "Guardando..." : "Responder"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Feedback card (after answering) */}
      {hasFeedback && (
        <FeedbackCard
          isCorrect={answerResult.isCorrect}
          selectedAnswer={selectedAnswer!}
          correctAnswer={answerResult.correctAnswer}
          selectedFeedbackHtml={answerResult.selectedFeedbackHtml}
          correctFeedbackHtml={answerResult.correctFeedbackHtml}
          generalFeedbackHtml={answerResult.generalFeedbackHtml}
          forceViewSolution={
            !answerResult.isCorrect && Boolean(answerResult.generalFeedbackHtml)
          }
          onViewSolution={onViewSolution}
        />
      )}

      {/* Next button (after feedback) */}
      {hasFeedback && (
        <>
          <div className="hidden sm:flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onNext}
              disabled={!canAdvance}
              className={[
                "btn-primary text-sm flex items-center gap-2",
                !canAdvance ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              Siguiente
              <ArrowRightIcon />
            </button>
            {!canAdvance && (
              <p className="text-xs text-amber-700 self-center">
                Lee la explicación completa para continuar
              </p>
            )}
          </div>
          <div
            className="fixed bottom-0 inset-x-0 p-4 bg-white/90
              backdrop-blur border-t border-gray-100
              safe-area-bottom sm:hidden z-30"
          >
            {!canAdvance ? (
              <p
                className="text-xs text-amber-700 text-center
                  mb-2 font-medium"
              >
                Lee la explicación completa para continuar
              </p>
            ) : null}
            <button
              type="button"
              onClick={onNext}
              disabled={!canAdvance}
              className={[
                "btn-primary w-full text-sm flex items-center",
                "justify-center gap-2",
                !canAdvance ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              Siguiente
              <ArrowRightIcon />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================
   Option circle (letter / checkmark / cross)
   ================================================================ */

function OptionCircle({
  letter,
  checked,
  isCorrect,
  isWrong,
}: {
  letter: string;
  checked: boolean;
  isCorrect: boolean;
  isWrong: boolean;
}) {
  let bg = "bg-gray-100 text-gray-600";
  if (isCorrect) bg = "bg-emerald-500 text-white";
  else if (isWrong) bg = "bg-red-500 text-white";
  else if (checked) bg = "bg-primary text-white";

  return (
    <span
      className={`w-8 h-8 rounded-full flex items-center justify-center
        text-sm font-bold shrink-0 transition-colors ${bg}`}
    >
      {isCorrect ? <CheckIcon /> : isWrong ? <CrossIcon /> : letter}
    </span>
  );
}

/* ================================================================
   Main view
   ================================================================ */

export function AtomStudyView({ ctrl }: { ctrl: Controller }) {
  if (ctrl.phase === "loading") return <AtomStudySkeleton />;

  if (ctrl.phase === "access_required") {
    return <UpgradePrompt variant="card" />;
  }

  if (ctrl.phase === "error") {
    return <ErrorStatePanel message={ctrl.error ?? "Algo salió mal"} />;
  }

  if (ctrl.phase === "lesson" && ctrl.session?.lessonHtml) {
    return (
      <AtomLessonView
        lessonHtml={ctrl.session.lessonHtml}
        atomTitle={ctrl.session.atomTitle}
        onComplete={() => void ctrl.markLessonViewed()}
      />
    );
  }

  if (ctrl.phase === "result") {
    const ar = ctrl.answerResult as Record<string, unknown> | null;
    return (
      <AtomResultPanel
        status={ctrl.finalStatus ?? "failed"}
        atomTitle={ctrl.session?.atomTitle ?? "Concepto"}
        totalAnswered={ctrl.totalAnswered}
        totalCorrect={ctrl.totalCorrect}
        attemptNumber={ctrl.session?.attemptNumber ?? 1}
        prereqScan={
          ar?.prereqScan as
            | {
                sessionId: string | null;
                prereqCount: number;
                status: "in_progress" | "no_prereqs";
              }
            | undefined
        }
        cooldownApplied={ar?.cooldownApplied as boolean | undefined}
        cooldownRemaining={ar?.cooldownRemaining as number | undefined}
        questionsUnlocked={ar?.questionsUnlocked as number | undefined}
        nextAtom={
          ar?.nextAtom as { id: string; title: string } | null | undefined
        }
      />
    );
  }

  // question & feedback phases share the same layout
  if (!ctrl.question) {
    return <ErrorStatePanel message="No se pudo cargar la pregunta." />;
  }

  const atomTitle = ctrl.session?.atomTitle ?? "Mini-clase";

  return (
    <div className="space-y-4">
      {/* Header card with mastery progress */}
      <section
        className="rounded-2xl border border-gray-200 bg-white
          p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-serif font-semibold text-primary">
              {atomTitle}
            </h2>
            <p className="text-xs text-gray-500">
              Concepto adaptativo · intento {ctrl.session?.attemptNumber ?? 1}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-600 font-medium">
              {ctrl.totalCorrect}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{ctrl.totalAnswered}</span>
            <span className="text-xs text-gray-400">correctas</span>
          </div>
        </div>
        <MasteryMeter
          difficulty={ctrl.difficulty}
          consecutiveCorrect={ctrl.answerResult?.consecutiveCorrect ?? 0}
          totalAnswered={ctrl.totalAnswered}
          totalCorrect={ctrl.totalCorrect}
        />
      </section>

      {/* Question / feedback card */}
      <div key={ctrl.question.responseId} className="animate-fade-in-up">
        <AtomQuestionCard
          question={ctrl.question}
          difficulty={ctrl.difficulty}
          selectedAnswer={ctrl.selectedAnswer}
          answerResult={ctrl.phase === "feedback" ? ctrl.answerResult : null}
          submitting={ctrl.submitting}
          canAdvance={ctrl.canAdvance}
          onSelectAnswer={ctrl.setSelectedAnswer}
          onSubmit={() => void ctrl.submitAnswer()}
          onNext={() => void ctrl.advanceAfterFeedback()}
          onViewSolution={ctrl.markExplanationViewed}
        />
      </div>

      {/* Habit guard intervention (spec 13.3) */}
      {(() => {
        if (ctrl.phase !== "feedback") return null;
        const ar = ctrl.answerResult as Record<string, unknown> | null;
        const guard = ar?.habitGuard as
          | { suggestion: HabitGuardSuggestion | null }
          | undefined;
        if (!guard?.suggestion) return null;
        return <HabitGuardBanner suggestion={guard.suggestion} />;
      })()}
    </div>
  );
}

/* ================================================================
   Inline SVG icons
   ================================================================ */

function ArrowRightIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 animate-scale-in"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      className="w-4 h-4 animate-scale-in"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
