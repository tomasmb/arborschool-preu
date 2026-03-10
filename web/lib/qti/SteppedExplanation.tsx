"use client";

import { useState, useMemo } from "react";
import { MathContent } from "./MathRenderer";

type Step = { title: string; bodyHtml: string };

/**
 * Parse generalFeedbackHtml into individual steps.
 * Expects an `<ol>` containing `<li>` elements, each with a leading
 * `<strong>` title (e.g. "Paso 1: …") followed by explanation content.
 */
function parseSteps(html: string): Step[] | null {
  if (typeof window === "undefined") return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const ol = doc.querySelector("ol");
  if (!ol) return null;

  const items = ol.querySelectorAll(":scope > li");
  if (items.length === 0) return null;

  const steps: Step[] = [];

  items.forEach((li) => {
    const clone = li.cloneNode(true) as HTMLElement;

    // Extract title from the first <strong> found in any child <p>
    let title = "";
    const firstStrong = clone.querySelector("strong");
    if (firstStrong) {
      title = firstStrong.textContent?.trim() ?? "";
      // Remove the <p> containing the title from body
      const parentP = firstStrong.closest("p");
      if (parentP) parentP.remove();
    }

    const bodyHtml = clone.innerHTML.trim();
    steps.push({
      title: title || `Paso ${steps.length + 1}`,
      bodyHtml,
    });
  });

  return steps.length > 0 ? steps : null;
}

// ============================================================================
// Component
// ============================================================================

type SteppedExplanationProps = {
  html: string;
  /** When true, steps must be revealed one at a time */
  forceSequential: boolean;
  /** Called when all steps have been revealed */
  onAllRevealed?: () => void;
};

export function SteppedExplanation({
  html,
  forceSequential,
  onAllRevealed,
}: SteppedExplanationProps) {
  const steps = useMemo(() => parseSteps(html), [html]);
  const stepCount = steps?.length ?? 0;

  // When not forced sequential, all steps start revealed
  const initialRevealed = forceSequential ? -1 : stepCount - 1;
  const [revealedUpTo, setRevealedUpTo] = useState(initialRevealed);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [notifiedComplete, setNotifiedComplete] = useState(!forceSequential);

  // Fallback: render as a single block if we can't parse steps
  if (!steps) {
    return (
      <MathContent
        html={html}
        className="prose prose-sm max-w-none text-charcoal
          rounded-xl bg-primary/5 border border-primary/15 p-4"
      />
    );
  }

  const allRevealed = revealedUpTo >= steps.length - 1;

  function revealStep(idx: number) {
    if (forceSequential && idx !== revealedUpTo + 1) return;

    setRevealedUpTo((prev) => Math.max(prev, idx));
    setExpandedIdx((prev) => (prev === idx ? null : idx));

    if (idx === steps!.length - 1 && !notifiedComplete) {
      setNotifiedComplete(true);
      onAllRevealed?.();
    }
  }

  function toggleStep(idx: number) {
    if (idx > revealedUpTo) return;
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  }

  return (
    <div className="space-y-2">
      {/* Title row extracted from pre-ol content */}
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
        Resolución paso a paso
      </p>

      {steps.map((step, idx) => {
        const isRevealed = idx <= revealedUpTo;
        const isNext = idx === revealedUpTo + 1;
        const isExpanded = expandedIdx === idx;
        const isLocked = !isRevealed && !isNext;

        return (
          <div
            key={idx}
            className={[
              "rounded-xl border transition-all duration-300",
              isRevealed
                ? "border-primary/20 bg-primary/5"
                : isNext
                  ? "border-primary/40 bg-white shadow-sm"
                  : "border-gray-200 bg-gray-50/50",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => (isRevealed ? toggleStep(idx) : revealStep(idx))}
              disabled={isLocked}
              className={[
                "w-full flex items-center gap-3 px-4 py-3 text-left",
                "transition-colors duration-200",
                isLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                isNext && !isRevealed ? "hover:bg-primary/5" : "",
              ].join(" ")}
            >
              {/* Step number circle */}
              <span
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  "text-xs font-bold shrink-0 transition-colors",
                  isRevealed
                    ? "bg-primary text-white"
                    : isNext
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-200 text-gray-400",
                ].join(" ")}
              >
                {isRevealed ? <MiniCheckIcon /> : idx + 1}
              </span>

              {/* Title */}
              <span
                className={[
                  "flex-1 text-sm font-medium",
                  isRevealed
                    ? "text-charcoal"
                    : isNext
                      ? "text-primary"
                      : "text-gray-400",
                ].join(" ")}
              >
                {step.title}
              </span>

              {/* Chevron / lock icon */}
              {isLocked ? <LockIcon /> : <ChevronIcon open={isExpanded} />}
            </button>

            {/* Expandable body */}
            {isRevealed && (
              <div
                className={[
                  "overflow-hidden transition-all duration-300",
                  isExpanded
                    ? "max-h-[2000px] opacity-100"
                    : "max-h-0 opacity-0",
                ].join(" ")}
              >
                <div className="px-4 pb-4 pl-14">
                  <MathContent
                    html={step.bodyHtml}
                    className="prose prose-sm max-w-none text-charcoal"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {allRevealed && (
        <p
          className="text-xs text-emerald-600 font-medium text-center
            pt-1 animate-fade-in-up"
        >
          Has revisado todos los pasos
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function MiniCheckIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={[
        "w-4 h-4 text-gray-400 transition-transform duration-200",
        open ? "rotate-90" : "",
      ].join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-300"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
