"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { InlineRecoveryPanel } from "../components";
import { filterNumericInput } from "@/lib/student/constants";
import type { GoalOption, PlanningProfileDraft } from "./types";
import { OfferingAutocomplete } from "./OfferingAutocomplete";
import { formatPlanningCutoff, selectedPlanningOption } from "./goalHelpers";
import { StepCommitment } from "./StepCommitment";

type PlanningModeFlowProps = {
  loading: boolean;
  saving: boolean;
  options: GoalOption[];
  selectedOfferingId: string;
  planningProfile: PlanningProfileDraft;
  loadError: string | null;
  error: string | null;
  infoMessage: string | null;
  onRetryLoadGoals: () => void;
  onSelectOffering: (offeringId: string) => void;
  onPlanningProfileChange: (patch: Partial<PlanningProfileDraft>) => void;
  onStartDiagnostic: () => Promise<void>;
  onSaveForLater: () => Promise<void>;
};

const TOTAL_STEPS = 4;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            "h-2 rounded-full transition-all duration-300",
            i === current
              ? "w-8 bg-primary"
              : i < current
                ? "w-2 bg-primary/40"
                : "w-2 bg-gray-200",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function WizardShell({
  step,
  canGoBack,
  onBack,
  children,
}: {
  step: number;
  canGoBack: boolean;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500
              hover:text-gray-700 transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Atrás
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Image src="/logo-arbor.svg" alt="Arbor" width={24} height={24} />
            <span className="text-sm font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        )}
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function StepCareer({
  options,
  selectedOfferingId,
  loading,
  loadError,
  onSelectOffering,
  onRetryLoadGoals,
  onNext,
}: {
  options: GoalOption[];
  selectedOfferingId: string;
  loading: boolean;
  loadError: string | null;
  onSelectOffering: (id: string) => void;
  onRetryLoadGoals: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          ¿Qué te gustaría estudiar?
        </h2>
        <p className="text-sm text-gray-600">
          Elige la carrera y universidad que te interesa. Esto nos ayuda a
          calibrar tus objetivos.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando carreras...</p>
      ) : loadError ? (
        <InlineRecoveryPanel
          message={loadError}
          onRetry={onRetryLoadGoals}
          retryLabel="Intentar de nuevo"
        />
      ) : (
        <OfferingAutocomplete
          options={options}
          selectedOfferingId={selectedOfferingId}
          onSelectOffering={onSelectOffering}
          idPrefix="planning"
        />
      )}

      {selectedOfferingId ? (
        <button
          type="button"
          onClick={onNext}
          className="btn-cta w-full sm:w-auto flex items-center
            justify-center gap-2 py-3"
        >
          Continuar
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/**
 * Step 2: Suggested M1 target based on career interest.
 * The system suggests a target (cutoff + 30pt margin), student can adjust.
 */
function StepSuggestedTarget({
  option,
  m1Draft,
  onChangeM1,
  onNext,
}: {
  option: GoalOption | null;
  m1Draft: string;
  onChangeM1: (value: string) => void;
  onNext: () => void;
}) {
  const suggestedM1 = useMemo(() => {
    if (!option || option.lastCutoff === null) return null;
    const m1Weight = option.weights.find(
      (w) => w.testCode.toUpperCase() === "M1"
    );
    if (!m1Weight || m1Weight.weightPercent === 0) return null;
    const target = option.lastCutoff + 30;
    const fraction = m1Weight.weightPercent / 100;
    const raw = target / fraction;
    return Math.round(Math.max(100, Math.min(1000, raw)));
  }, [option]);

  const hasSuggestion = suggestedM1 !== null;
  const currentValue = m1Draft || (hasSuggestion ? String(suggestedM1) : "");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          Te recomendamos este objetivo
        </h2>
        <p className="text-sm text-gray-600">
          Basado en tu carrera de interés, este es el puntaje M1 que necesitas.
          Puedes ajustarlo — es TU objetivo.
        </p>
      </div>

      {option && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-1">
          <p className="text-sm font-medium text-gray-800">
            {option.careerName} — {option.universityName}
          </p>
          <p className="text-xs text-gray-500">
            Último corte: {formatPlanningCutoff(option)}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="m1-target"
          className="block text-sm font-medium text-gray-700"
        >
          Tu objetivo M1
        </label>
        <input
          id="m1-target"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={currentValue}
          onChange={(e) => onChangeM1(filterNumericInput(e.target.value))}
          placeholder="Ej: 700"
          className="w-full max-w-xs rounded-xl border border-gray-200 bg-white
            px-4 py-3 text-lg font-bold tabular-nums
            focus:border-primary focus:ring-2 focus:ring-primary/10
            focus:outline-none transition-all"
        />
        {hasSuggestion && (
          <p className="text-xs text-gray-400">
            Sugerencia: {suggestedM1} pts (corte + 30 pts de margen)
          </p>
        )}
        <p className="text-xs text-gray-500">
          Estos son TUS objetivos. Puedes cambiarlos cuando quieras.
        </p>
      </div>

      {currentValue && (
        <button
          type="button"
          onClick={onNext}
          className="btn-cta w-full sm:w-auto flex items-center
            justify-center gap-2 py-3"
        >
          Continuar
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function StepConfirm({
  option,
  m1Draft,
  saving,
  error,
  infoMessage,
  onStartDiagnostic,
  onSaveForLater,
}: {
  option: GoalOption | null;
  m1Draft: string;
  saving: boolean;
  error: string | null;
  infoMessage: string | null;
  onStartDiagnostic: () => Promise<void>;
  onSaveForLater: () => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          Todo listo para tu diagnóstico
        </h2>
        <p className="text-sm text-gray-600">
          Con tu objetivo definido, el diagnóstico priorizará qué estudiar
          primero.
        </p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        {option && (
          <div>
            <p className="text-xs font-medium text-gray-500">
              Carrera de interés
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {option.careerName} — {option.universityName}
            </p>
          </div>
        )}
        {m1Draft && (
          <div>
            <p className="text-xs font-medium text-gray-500">Tu objetivo M1</p>
            <p className="text-lg font-bold text-primary tabular-nums">
              {m1Draft} pts
            </p>
          </div>
        )}
      </div>

      <div
        className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50
          border border-amber-200 p-4"
      >
        <p className="text-sm text-amber-800 font-medium">
          El diagnóstico dura ~15 min y no tiene nota. Es para calibrar tu
          nivel.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {infoMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {infoMessage}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => void onStartDiagnostic()}
          disabled={saving}
          className="btn-cta py-3.5 flex-1 sm:flex-none flex items-center
            justify-center gap-2 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Empezar diagnóstico"}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => void onSaveForLater()}
          disabled={saving}
          className="btn-secondary py-3 disabled:opacity-60"
        >
          Guardar y continuar después
        </button>
      </div>
    </div>
  );
}

export function PlanningModeFlow(props: PlanningModeFlowProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [m1Draft, setM1Draft] = useState("");

  const option = useMemo(
    () => selectedPlanningOption(props.options, props.selectedOfferingId),
    [props.options, props.selectedOfferingId]
  );

  function goForward(next: number) {
    setDirection("forward");
    setStep(next);
  }

  function goBack() {
    setDirection("back");
    setStep((s) => Math.max(0, s - 1));
  }

  const transitionClass =
    direction === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
      <WizardShell step={step} canGoBack={step > 0} onBack={goBack}>
        <div key={step} className={transitionClass}>
          {step === 0 ? (
            <StepCareer
              options={props.options}
              selectedOfferingId={props.selectedOfferingId}
              loading={props.loading}
              loadError={props.loadError}
              onSelectOffering={props.onSelectOffering}
              onRetryLoadGoals={props.onRetryLoadGoals}
              onNext={() => goForward(1)}
            />
          ) : step === 1 ? (
            <StepSuggestedTarget
              option={option}
              m1Draft={m1Draft}
              onChangeM1={setM1Draft}
              onNext={() => goForward(2)}
            />
          ) : step === 2 ? (
            <StepCommitment
              planningProfile={props.planningProfile}
              onPlanningProfileChange={props.onPlanningProfileChange}
              onNext={() => goForward(3)}
            />
          ) : (
            <StepConfirm
              option={option}
              m1Draft={m1Draft}
              saving={props.saving}
              error={props.error}
              infoMessage={props.infoMessage}
              onStartDiagnostic={props.onStartDiagnostic}
              onSaveForLater={props.onSaveForLater}
            />
          )}
        </div>
      </WizardShell>
    </section>
  );
}
