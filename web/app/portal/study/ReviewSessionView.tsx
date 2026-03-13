"use client";

import Link from "next/link";
import { MathContent } from "@/lib/qti/MathRenderer";
import {
  ErrorStatePanel,
  QuestionSkeleton,
  UpgradePrompt,
} from "../components";
import type { useReviewSessionController } from "./useReviewSessionController";

type Controller = ReturnType<typeof useReviewSessionController>;

function EmptyReviewState() {
  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white
        p-6 sm:p-8 text-center space-y-4"
    >
      <div
        className="mx-auto w-14 h-14 rounded-full bg-emerald-50
          flex items-center justify-center"
      >
        <svg
          className="w-7 h-7 text-emerald-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-lg font-serif font-semibold text-primary">
        Sin repasos pendientes
      </h2>
      <p className="text-sm text-gray-600 max-w-md mx-auto">
        No tienes conceptos que necesiten repaso ahora mismo. Sigue aprendiendo
        nuevos conceptos y volveremos a avisarte.
      </p>
      <Link href="/portal" className="btn-primary inline-block text-sm">
        Volver al inicio
      </Link>
    </section>
  );
}

function ReviewQuestionCard({ ctrl }: { ctrl: Controller }) {
  const item = ctrl.currentItem;
  if (!item) return null;
  const hasFeedback = ctrl.answerResult !== null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
              Repaso {ctrl.currentIndex + 1} de {ctrl.totalItems}
            </p>
            <p className="text-sm font-medium text-primary mt-0.5">
              {item.atomTitle}
            </p>
          </div>
          <span
            className="inline-block text-[11px] uppercase tracking-wider
              font-semibold px-2.5 py-0.5 rounded-full
              bg-violet-100 text-violet-700"
          >
            Repaso
          </span>
        </div>

        <MathContent
          html={item.questionHtml}
          className="prose prose-sm max-w-none text-gray-800"
        />

        <div className="grid gap-2">
          {item.options.map((option) => {
            const checked = ctrl.selectedAnswer === option.letter;
            const isCorrectAnswer =
              hasFeedback && ctrl.answerResult!.correctAnswer === option.letter;
            const isWrongSelection =
              hasFeedback && checked && !ctrl.answerResult!.isCorrect;

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
                onClick={() =>
                  !hasFeedback && ctrl.setSelectedAnswer(option.letter)
                }
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
                <span
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "text-sm font-bold shrink-0 transition-colors",
                    isCorrectAnswer && hasFeedback
                      ? "bg-emerald-500 text-white"
                      : isWrongSelection
                        ? "bg-red-500 text-white"
                        : checked
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {option.letter}
                </span>
                <MathContent html={option.text} className="flex-1" />
              </button>
            );
          })}
        </div>

        {!hasFeedback && (
          <>
            <div className="hidden sm:flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void ctrl.submitAnswer()}
                disabled={ctrl.submitting || !ctrl.selectedAnswer}
                className="btn-primary text-sm disabled:opacity-60"
              >
                {ctrl.submitting ? "Guardando..." : "Responder"}
              </button>
            </div>
            <div
              className="fixed bottom-0 inset-x-0 p-4 bg-white/90
                backdrop-blur border-t border-gray-100
                safe-area-bottom sm:hidden z-30"
            >
              <button
                type="button"
                onClick={() => void ctrl.submitAnswer()}
                disabled={ctrl.submitting || !ctrl.selectedAnswer}
                className="btn-primary w-full text-sm disabled:opacity-60"
              >
                {ctrl.submitting ? "Guardando..." : "Responder"}
              </button>
            </div>
          </>
        )}
      </section>

      {hasFeedback && (
        <section
          className={[
            "rounded-2xl border p-4 text-center",
            ctrl.answerResult!.isCorrect
              ? "bg-emerald-50 border-emerald-200"
              : "bg-rose-50 border-rose-200",
          ].join(" ")}
        >
          <p
            className={[
              "text-sm font-semibold",
              ctrl.answerResult!.isCorrect
                ? "text-emerald-700"
                : "text-rose-700",
            ].join(" ")}
          >
            {ctrl.answerResult!.isCorrect ? "Correcto" : "Incorrecto"}
          </p>
        </section>
      )}

      {hasFeedback && (
        <>
          <div className="hidden sm:flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void ctrl.advanceToNext()}
              disabled={ctrl.completing}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {ctrl.currentIndex + 1 < ctrl.totalItems
                ? "Siguiente"
                : "Ver resultados"}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div
            className="fixed bottom-0 inset-x-0 p-4 bg-white/90
              backdrop-blur border-t border-gray-100
              safe-area-bottom sm:hidden z-30"
          >
            <button
              type="button"
              onClick={() => void ctrl.advanceToNext()}
              disabled={ctrl.completing}
              className="btn-primary w-full text-sm flex items-center
                justify-center gap-2"
            >
              {ctrl.currentIndex + 1 < ctrl.totalItems
                ? "Siguiente"
                : "Ver resultados"}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ReviewResultPanel({ ctrl }: { ctrl: Controller }) {
  const comp = ctrl.completion;
  if (!comp) return null;
  const total = comp.passed + comp.failed;
  const accuracy = total > 0 ? Math.round((comp.passed / total) * 100) : 0;
  const allPassed = comp.failed === 0;

  const scans = comp.failureResult?.pendingScans ?? [];

  return (
    <section
      className={[
        "rounded-2xl p-6 sm:p-8 space-y-6 border",
        allPassed
          ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
          : "bg-gradient-to-br from-amber-50 to-white border-amber-200",
      ].join(" ")}
    >
      <div className="text-center space-y-2">
        <div
          className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5",
            "text-sm font-medium",
            allPassed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700",
          ].join(" ")}
        >
          {allPassed ? "Repaso perfecto" : "Repaso completado"}
        </div>
        <h2
          className="text-2xl sm:text-3xl font-serif font-bold
            text-primary"
        >
          {comp.passed} de {total} correctas
        </h2>
        <p className="text-sm text-gray-500">Precisión: {accuracy}%</p>
      </div>

      {scans.length > 0 && (
        <div
          className="rounded-xl bg-amber-50 border border-amber-200
            p-4 text-center space-y-2"
        >
          <p className="text-sm text-amber-700">
            {scans.length === 1
              ? "Se detectó un vacío en 1 concepto previo"
              : `Se detectaron vacíos en ${scans.length} conceptos previos`}
          </p>
          <Link
            href={`/portal/study?scan=${scans[0].scanSessionId}`}
            className="btn-primary inline-block text-sm"
          >
            Verificar bases
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/portal" className="btn-cta text-center text-sm py-3 px-6">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export function ReviewSessionView({ ctrl }: { ctrl: Controller }) {
  if (ctrl.phase === "loading") return <QuestionSkeleton />;
  if (ctrl.phase === "access_required") return <UpgradePrompt variant="card" />;
  if (ctrl.phase === "empty") return <EmptyReviewState />;
  if (ctrl.phase === "error") {
    return (
      <ErrorStatePanel message={ctrl.error ?? "Error en sesión de repaso"} />
    );
  }
  if (ctrl.phase === "result") return <ReviewResultPanel ctrl={ctrl} />;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-semibold text-primary">
              Repaso espaciado
            </h2>
            <p className="text-xs text-gray-500">
              {ctrl.answeredCount} de {ctrl.totalItems} respondidas
              {ctrl.correctCount > 0 && <> · {ctrl.correctCount} correctas</>}
            </p>
          </div>
          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all
                duration-500"
              style={{
                width: `${ctrl.totalItems > 0 ? (ctrl.answeredCount / ctrl.totalItems) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </section>

      <div key={ctrl.currentItem?.responseId} className="animate-fade-in-up">
        <ReviewQuestionCard ctrl={ctrl} />
      </div>
    </div>
  );
}
