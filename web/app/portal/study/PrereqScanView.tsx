"use client";

import Link from "next/link";
import { MathContent } from "@/lib/qti/MathRenderer";
import { ErrorStatePanel } from "../components";
import type { usePrereqScanController } from "./usePrereqScanController";

type Controller = ReturnType<typeof usePrereqScanController>;

function ScanSkeleton() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border border-gray-200 bg-white
          p-5 animate-pulse"
      >
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
      <div
        className="rounded-2xl border border-gray-200 bg-white
          p-5 animate-pulse space-y-4"
      >
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

function ScanQuestionCard({ ctrl }: { ctrl: Controller }) {
  const q = ctrl.question;
  if (!q) return null;
  const hasFeedback = ctrl.answerResult !== null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
              Verificación {q.position} de {q.totalPrereqs}
            </p>
            <p className="text-sm font-medium text-amber-700 mt-0.5">
              {q.prereqTitle}
            </p>
          </div>
          <span
            className="inline-block text-[11px] uppercase tracking-wider
              font-semibold px-2.5 py-0.5 rounded-full
              bg-amber-100 text-amber-700"
          >
            Prerequisito
          </span>
        </div>

        <MathContent
          html={q.questionHtml}
          className="prose prose-sm max-w-none text-gray-800"
        />

        <div className="grid gap-2">
          {q.options.map((option) => {
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
                {ctrl.submitting ? "Verificando..." : "Responder"}
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
                {ctrl.submitting ? "Verificando..." : "Responder"}
              </button>
            </div>
          </>
        )}
      </section>

      {hasFeedback && ctrl.answerResult!.isCorrect && (
        <>
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">
              Correcto — esta base está sólida
            </p>
          </section>
          <div className="hidden sm:flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void ctrl.advanceToNext()}
              className="btn-primary text-sm flex items-center gap-2"
            >
              Siguiente verificación
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
              className="btn-primary w-full text-sm flex items-center
                justify-center gap-2"
            >
              Siguiente verificación
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GapFoundPanel({ ctrl }: { ctrl: Controller }) {
  const gapPrereq = ctrl.question?.prereqTitle ?? "un concepto previo";

  return (
    <section
      className="rounded-2xl p-6 sm:p-8 space-y-6 border
        bg-gradient-to-br from-amber-50 to-white border-amber-200"
    >
      <div className="text-center space-y-2">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
            text-sm font-medium bg-amber-100 text-amber-700"
        >
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Vacío detectado
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          Detectamos un vacío en {gapPrereq}
        </h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          No te preocupes — esto es exactamente lo que necesitamos encontrar.
          Reforzar este concepto te ayudará a avanzar más rápido.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {ctrl.gapAtomId && (
          <Link
            href={`/portal/study?atom=${ctrl.gapAtomId}`}
            className="btn-cta text-center text-sm py-3 px-6"
          >
            Estudiar: {gapPrereq}
          </Link>
        )}
        <Link href="/portal" className="btn-secondary text-center">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

function AllClearPanel({ ctrl }: { ctrl: Controller }) {
  const passed = ctrl.scannedPrereqs.filter((p) => p.correct).length;
  const total = ctrl.scannedPrereqs.length;

  return (
    <section
      className="rounded-2xl p-6 sm:p-8 space-y-6 border
        bg-gradient-to-br from-blue-50 to-white border-blue-200"
    >
      <div className="text-center space-y-2">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
            text-sm font-medium bg-blue-100 text-blue-700"
        >
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Bases verificadas
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          Tus bases están sólidas
        </h2>
        <p className="text-sm text-gray-500">
          {passed} de {total} prerequisitos verificados correctamente
        </p>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          El concepto queda en pausa. Domina 3 conceptos más y lo intentaremos
          de nuevo con ojos frescos.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/portal" className="btn-cta text-center text-sm py-3 px-6">
          Continuar aprendiendo
        </Link>
      </div>
    </section>
  );
}

export function PrereqScanView({ ctrl }: { ctrl: Controller }) {
  if (ctrl.phase === "loading") return <ScanSkeleton />;
  if (ctrl.phase === "error") {
    return (
      <ErrorStatePanel
        message={ctrl.error ?? "Error en verificación de bases"}
      />
    );
  }
  if (ctrl.phase === "gap_found") return <GapFoundPanel ctrl={ctrl} />;
  if (ctrl.phase === "all_clear") return <AllClearPanel ctrl={ctrl} />;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-semibold text-primary">
              Verificando bases
            </h2>
            <p className="text-xs text-gray-500">
              Revisando conceptos previos para encontrar dónde reforzar
            </p>
          </div>
          {ctrl.question && (
            <div className="h-2 w-24 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all
                  duration-500"
                style={{
                  width: `${
                    ctrl.question.totalPrereqs > 0
                      ? ((ctrl.question.position - 1) /
                          ctrl.question.totalPrereqs) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
        </div>
      </section>

      <div key={ctrl.question?.responseId} className="animate-fade-in-up">
        <ScanQuestionCard ctrl={ctrl} />
      </div>
    </div>
  );
}
