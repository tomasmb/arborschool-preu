"use client";

import { useCallback, useRef, useState } from "react";
import { formatScore } from "./formatters";

async function patchPrimaryScore(score: number): Promise<boolean> {
  try {
    const res = await fetch("/api/student/goals/primary-score", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testCode: "M1", score }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function EditableMetaScore({
  target,
  goalLabel,
  onTargetChange,
}: {
  target: number;
  goalLabel: string | null;
  onTargetChange: (newTarget: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);

  const commitEdit = useCallback(async () => {
    if (committingRef.current) return;
    committingRef.current = true;

    const raw = inputRef.current?.value ?? "";
    const parsed = Math.round(Number(raw));
    setEditing(false);

    if (!Number.isFinite(parsed) || parsed < 100 || parsed > 1000) {
      committingRef.current = false;
      return;
    }
    if (parsed === target) {
      committingRef.current = false;
      return;
    }

    setSaving(true);
    const ok = await patchPrimaryScore(parsed);
    setSaving(false);
    committingRef.current = false;

    if (ok) {
      onTargetChange(parsed);
    }
  }, [target, onTargetChange]);

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-xs text-gray-500">Meta:</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          defaultValue={target}
          autoFocus
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-16 rounded border border-primary/30 bg-white px-1.5
            py-0.5 text-xs tabular-nums text-right
            focus:border-primary focus:ring-1 focus:ring-primary/20
            focus:outline-none"
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => setEditing(true)}
      title={goalLabel ?? "Editar meta M1"}
      className="inline-flex items-center gap-1 text-xs text-gray-500
        hover:text-primary transition-colors group cursor-pointer"
    >
      <span>Meta: {saving ? "…" : formatScore(target)}</span>
      <svg
        className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652
            2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6
            18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
        />
      </svg>
    </button>
  );
}
