"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MathContent } from "@/lib/qti/MathRenderer";

type AtomLessonViewProps = {
  lessonHtml: string;
  atomTitle: string;
  onComplete: () => void;
};

type Segment = { title: string | null; html: string };

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4"]);

/**
 * Collect top-level elements from the lesson body, recursing into
 * wrapper `<div>`s that have no semantic class/id of their own.
 */
function collectTopLevelElements(root: Element): Element[] {
  const elements: Element[] = [];
  for (const child of Array.from(root.children)) {
    const tag = child.tagName.toLowerCase();
    if (
      tag === "div" &&
      !child.id &&
      !child.className &&
      child.children.length > 0
    ) {
      elements.push(...collectTopLevelElements(child));
    } else {
      elements.push(child);
    }
  }
  return elements;
}

/**
 * Split lesson HTML into semantic segments at heading boundaries.
 * Each heading (h1-h4) starts a new segment whose `title` is the
 * heading text. Content following the heading is the segment body.
 */
function splitLessonIntoSegments(html: string, atomTitle: string): Segment[] {
  if (typeof window === "undefined") {
    return [{ title: null, html }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const elements = collectTopLevelElements(doc.body);

  const segments: Segment[] = [];
  let currentTitle: string | null = null;
  let currentBlocks: string[] = [];

  function flush() {
    if (currentBlocks.length > 0 || currentTitle !== null) {
      segments.push({
        title: currentTitle,
        html: currentBlocks.join(""),
      });
    }
    currentTitle = null;
    currentBlocks = [];
  }

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();

    if (HEADING_TAGS.has(tag)) {
      flush();
      currentTitle = el.textContent?.trim() || null;
      continue;
    }

    if (tag === "hr") {
      flush();
      continue;
    }

    currentBlocks.push(el.outerHTML);
  }
  flush();

  // Strip first title if it matches atomTitle (redundancy fix)
  if (
    segments.length > 0 &&
    segments[0].title &&
    segments[0].title.toLowerCase().trim() === atomTitle.toLowerCase().trim()
  ) {
    segments[0].title = null;
  }

  // Filter out empty segments (no title and no html)
  const filtered = segments.filter((s) => s.title || s.html.trim());
  return filtered.length > 0 ? filtered : [{ title: null, html }];
}

/** Rough reading time estimate: ~200 words/min for Spanish */
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function AtomLessonView({
  lessonHtml,
  atomTitle,
  onComplete,
}: AtomLessonViewProps) {
  const segments = useMemo(
    () => splitLessonIntoSegments(lessonHtml, atomTitle),
    [lessonHtml, atomTitle]
  );
  const [page, setPage] = useState(0);
  const [furthestReached, setFurthestReached] = useState(0);
  const total = segments.length;
  const isLast = page === total - 1;
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const current = segments[page];

  const totalMinutes = useMemo(
    () => estimateReadingTime(lessonHtml),
    [lessonHtml]
  );

  const progressPct = Math.round(((page + 1) / total) * 100);

  // Scroll the active step pill into view on mobile
  const roadmapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = roadmapRef.current;
    if (!container) return;
    const active = container.querySelector("[data-active]");
    if (active) {
      active.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [page]);

  function goNext() {
    setSlideDir("right");
    setPage((p) => {
      const next = p + 1;
      setFurthestReached((f) => Math.max(f, next));
      return next;
    });
  }

  function goPrev() {
    setSlideDir("left");
    setPage((p) => p - 1);
  }

  function goTo(i: number) {
    if (i > furthestReached) return;
    setSlideDir(i > page ? "right" : "left");
    setPage(i);
  }

  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white
        overflow-hidden"
    >
      {/* Progress bar at the top */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-primary
            to-primary-light transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <span
              className="inline-flex items-center gap-1.5 text-[11px]
                uppercase tracking-wider font-semibold text-primary
                bg-primary/10 px-2.5 py-0.5 rounded-full"
            >
              <BookIcon />
              Mini-clase
            </span>
            <h2 className="text-lg font-serif font-semibold text-primary">
              {atomTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-cool-gray">
            <span className="flex items-center gap-1">
              <ClockIcon />~{totalMinutes} min
            </span>
            <span className="font-medium">
              {page + 1} / {total}
            </span>
          </div>
        </div>

        {/* Step roadmap */}
        {total > 1 && (
          <div
            ref={roadmapRef}
            className="flex items-center gap-1.5 overflow-x-auto
              pb-1 -mx-1 px-1 scrollbar-none"
          >
            {segments.map((seg, i) => {
              const isCurrent = i === page;
              const isVisited = i <= furthestReached;
              const isLocked = i > furthestReached;
              const label = seg.title
                ? seg.title
                : i === 0
                  ? "Intro"
                  : `Paso ${i + 1}`;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={isLocked}
                  {...(isCurrent ? { "data-active": true } : {})}
                  className={[
                    "shrink-0 flex items-center gap-1.5 px-2.5 py-1",
                    "rounded-full text-[11px] font-medium",
                    "transition-all duration-300 whitespace-nowrap",
                    isCurrent
                      ? "bg-primary text-white shadow-sm"
                      : isVisited
                        ? "bg-primary/10 text-primary/70"
                        : "bg-gray-100 text-gray-400/60 cursor-not-allowed",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-4 h-4 rounded-full flex items-center",
                      "justify-center text-[9px] font-bold shrink-0",
                      isCurrent
                        ? "bg-white/25 text-white"
                        : isVisited
                          ? "bg-primary/20 text-primary/70"
                          : "bg-gray-200 text-gray-400",
                    ].join(" ")}
                  >
                    {isVisited && !isCurrent ? <MiniCheckIcon /> : i + 1}
                  </span>
                  <span className="hidden sm:inline truncate max-w-[120px]">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Section title (when the current step has one) */}
        {current.title && (
          <h3
            key={`title-${page}`}
            className={[
              "text-base font-serif font-semibold text-primary",
              "border-l-4 border-primary pl-3",
              slideDir === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left",
            ].join(" ")}
          >
            {current.title}
          </h3>
        )}

        {/* Content area with slide animation */}
        {current.html.trim() && (
          <div className="overflow-hidden">
            <MathContent
              key={page}
              html={current.html}
              className={[
                "lesson-content max-w-none overflow-x-auto",
                slideDir === "right"
                  ? "animate-slide-in-right"
                  : "animate-slide-in-left",
              ].join(" ")}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {page > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <ArrowLeftIcon />
              Anterior
            </button>
          ) : (
            <span />
          )}

          {isLast ? (
            <button
              type="button"
              onClick={onComplete}
              className="btn-cta text-sm flex items-center gap-2
                animate-glow-pulse"
            >
              <BoltIcon />
              Comenzar preguntas
              <ArrowRightIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
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

/* -- Inline SVG icons ------------------------------------------------------ */

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

function BookIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168
          5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477
          4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0
          3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5
          18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function BoltIcon() {
  return (
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
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      />
    </svg>
  );
}

function MiniCheckIcon() {
  return (
    <svg
      className="w-2.5 h-2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
