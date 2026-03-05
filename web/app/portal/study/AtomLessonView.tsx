"use client";

import { useState, useMemo } from "react";
import { MathContent } from "@/lib/qti/MathRenderer";

type AtomLessonViewProps = {
  lessonHtml: string;
  atomTitle: string;
  onComplete: () => void;
};

/**
 * Split lesson HTML into segments at `<h2>`, `<h3>`, or `<hr>` boundaries.
 * Falls back to a single segment when running server-side or for short content.
 */
function splitLessonIntoSegments(html: string): string[] {
  if (typeof window === "undefined") return [html];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  const segments: string[] = [];
  let current: string[] = [];

  for (const child of Array.from(body.children)) {
    const tag = child.tagName.toLowerCase();
    if ((tag === "h2" || tag === "h3" || tag === "hr") && current.length > 0) {
      segments.push(current.join(""));
      current = [];
    }
    if (tag !== "hr") {
      current.push(child.outerHTML);
    }
  }
  if (current.length > 0) {
    segments.push(current.join(""));
  }

  return segments.length > 0 ? segments : [html];
}

export function AtomLessonView({
  lessonHtml,
  atomTitle,
  onComplete,
}: AtomLessonViewProps) {
  const segments = useMemo(
    () => splitLessonIntoSegments(lessonHtml),
    [lessonHtml]
  );
  const paginated = segments.length > 1;
  const [page, setPage] = useState(0);
  const total = segments.length;
  const isLast = page === total - 1;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Blue accent top bar */}
      <div
        className="h-1.5"
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
        }}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <span
              className="inline-block text-[11px] uppercase tracking-wider
                font-semibold text-primary bg-primary/10
                px-2.5 py-0.5 rounded-full"
            >
              Mini-clase
            </span>
            <h2 className="text-lg font-serif font-semibold text-primary">
              {atomTitle}
            </h2>
          </div>

          {paginated && (
            <span className="text-xs text-cool-gray font-medium shrink-0">
              Paso {page + 1} de {total}
            </span>
          )}
        </div>

        {/* Progress dots */}
        {paginated && (
          <div className="flex items-center gap-1.5">
            {segments.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-1.5 rounded-full transition-all duration-300",
                  i === page
                    ? "w-6 bg-primary"
                    : i < page
                      ? "w-3 bg-primary/40"
                      : "w-3 bg-gray-200",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        {/* Content area */}
        <MathContent
          key={page}
          html={paginated ? segments[page] : lessonHtml}
          className="animate-fade-in-up prose prose-sm sm:prose
            max-w-none text-charcoal overflow-x-auto"
        />

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {paginated && page > 0 ? (
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <ArrowLeftIcon />
              Anterior
            </button>
          ) : (
            <span />
          )}

          {isLast || !paginated ? (
            <button
              type="button"
              onClick={onComplete}
              className="btn-cta text-sm flex items-center gap-2"
            >
              Comenzar preguntas
              <ArrowRightIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              Siguiente
              <ArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Inline SVG icons ──────────────────────────────────────────────── */

function ArrowLeftIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

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
