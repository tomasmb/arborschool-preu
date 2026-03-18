"use client";

import { useEffect, useState } from "react";
import type { PlanningProfileDraft } from "./types";
import {
  buildExamDate,
  PAES_PERIOD_OPTIONS,
  PAES_YEAR_OPTIONS,
  parseExamDate,
  PLANNING_HOURS_STEP,
  PLANNING_MAX_HOURS,
  PLANNING_MIN_HOURS,
} from "./goalHelpers";

export function StepCommitment({
  planningProfile,
  onPlanningProfileChange,
  onNext,
}: {
  planningProfile: PlanningProfileDraft;
  onPlanningProfileChange: (patch: Partial<PlanningProfileDraft>) => void;
  onNext: () => void;
}) {
  const minutesNum = Number(planningProfile.weeklyMinutesTarget) || 360;
  const hoursPerWeek = minutesNum / 60;
  const atMin = hoursPerWeek <= PLANNING_MIN_HOURS;
  const atMax = hoursPerWeek >= PLANNING_MAX_HOURS;

  function changeHours(next: number) {
    const clamped = Math.min(
      PLANNING_MAX_HOURS,
      Math.max(PLANNING_MIN_HOURS, next)
    );
    onPlanningProfileChange({
      weeklyMinutesTarget: String(Math.round(clamped * 60)),
    });
  }

  const parsed = parseExamDate(planningProfile.examDate);
  const [examYear, setExamYear] = useState(parsed.year);
  const [examPeriod, setExamPeriod] = useState(parsed.period);

  useEffect(() => {
    const next = parseExamDate(planningProfile.examDate);
    setExamYear(next.year);
    setExamPeriod(next.period);
  }, [planningProfile.examDate]);

  function handleYearChange(y: string) {
    setExamYear(y);
    if (!y) {
      setExamPeriod("");
      onPlanningProfileChange({ examDate: "" });
      return;
    }
    if (examPeriod) {
      onPlanningProfileChange({ examDate: buildExamDate(y, examPeriod) });
    }
  }

  function handlePeriodChange(p: string) {
    setExamPeriod(p);
    if (examYear && p) {
      onPlanningProfileChange({ examDate: buildExamDate(examYear, p) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          ¿Cuánto tiempo puedes dedicar?
        </h2>
        <p className="text-sm text-gray-600">
          Define tu compromiso semanal y cuándo rendirás la PAES.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">
            Horas de estudio por semana
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={atMin}
              onClick={() => changeHours(hoursPerWeek - PLANNING_HOURS_STEP)}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-lg",
                "text-lg font-semibold transition",
                atMin
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
              aria-label="Reducir horas"
            >
              −
            </button>

            <span className="min-w-[3.5rem] text-center text-lg font-semibold">
              {hoursPerWeek.toFixed(1)}h
            </span>

            <button
              type="button"
              disabled={atMax}
              onClick={() => changeHours(hoursPerWeek + PLANNING_HOURS_STEP)}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-lg",
                "text-lg font-semibold transition",
                atMax
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
              aria-label="Aumentar horas"
            >
              +
            </button>
          </div>

          <p className="text-xs text-gray-500">
            {minutesNum} min/semana — recomendamos al menos 2 horas
          </p>
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">
            ¿Cuándo rindes la PAES?
          </span>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={examYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3
                text-base focus:border-primary focus:ring-1
                focus:ring-primary/20 bg-white"
            >
              <option value="">Año</option>
              {PAES_YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={examPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              disabled={!examYear}
              className={[
                "w-full rounded-xl border border-gray-300 px-4 py-3",
                "text-base focus:border-primary focus:ring-1",
                "focus:ring-primary/20 bg-white",
                !examYear ? "text-gray-400 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <option value="">Período</option>
              {PAES_PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 block">
            Recordatorios
          </span>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className="flex items-center gap-3 rounded-xl border
                border-gray-200 px-4 py-3 cursor-pointer
                hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={planningProfile.reminderInApp}
                onChange={(e) =>
                  onPlanningProfileChange({
                    reminderInApp: e.target.checked,
                  })
                }
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm text-gray-700">En la app</span>
            </label>
            <label
              className="flex items-center gap-3 rounded-xl border
                border-gray-200 px-4 py-3 cursor-pointer
                hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={planningProfile.reminderEmail}
                onChange={(e) =>
                  onPlanningProfileChange({
                    reminderEmail: e.target.checked,
                  })
                }
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm text-gray-700">Por email</span>
            </label>
          </div>
        </div>
      </div>

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
    </div>
  );
}
