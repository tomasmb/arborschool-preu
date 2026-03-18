"use client";

import { filterNumericInput } from "@/lib/student/constants";

type ScoreInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  /** Optional weight badge (e.g. "10%") shown beside the label. */
  weightBadge?: string;
};

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
}: ScoreInputProps) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50/50 p-4
        space-y-2 transition-colors hover:border-primary/20"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="flex items-center gap-1.5">
          {weightBadge && (
            <span
              className="text-[10px] font-medium bg-primary/10
                text-primary rounded-full px-2 py-0.5"
            >
              {weightBadge}
            </span>
          )}
          {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
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
