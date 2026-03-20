"use client";

import { filterNumericInput } from "@/lib/student/constants";
import type { FieldSaveStatus } from "./usePortalObjectives";

type ScoreInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  /** Optional weight badge (e.g. "10%") shown beside the label. */
  weightBadge?: string;
  /** Auto-save status shown inline on the field. */
  saveStatus?: FieldSaveStatus;
};

function SaveIndicator({ status }: { status: FieldSaveStatus }) {
  if (status === "saving") {
    return (
      <span
        className="inline-block w-3 h-3 rounded-full border-2
          border-primary/40 border-t-primary animate-spin"
      />
    );
  }
  if (status === "saved") {
    return (
      <svg
        className="w-4 h-4 text-emerald-500 animate-in fade-in
          duration-200"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <span className="text-[10px] font-medium text-red-500">
        Error
      </span>
    );
  }
  return null;
}

/**
 * Reusable numeric score input card used across the goals/objectives
 * pages for PAES targets, profile estimates, and simulator scores.
 */
export function ScoreInput({
  label,
  value,
  onChange,
  placeholder = "Ej: 700",
  hint,
  weightBadge,
  saveStatus = "idle",
}: ScoreInputProps) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50/50 p-4
        space-y-2 transition-colors hover:border-primary/20"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">
          {label}
        </span>
        <span className="flex items-center gap-1.5">
          <SaveIndicator status={saveStatus} />
          {weightBadge && (
            <span
              className="text-[10px] font-medium bg-primary/10
                text-primary rounded-full px-2 py-0.5"
            >
              {weightBadge}
            </span>
          )}
          {hint && (
            <span className="text-[10px] text-gray-400">{hint}</span>
          )}
        </span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(filterNumericInput(e.target.value))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3
          py-2.5 text-sm font-medium tabular-nums
          focus:border-primary focus:ring-2 focus:ring-primary/10
          focus:outline-none transition-all placeholder:text-gray-300"
      />
    </div>
  );
}
