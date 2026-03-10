"use client";

import Link from "next/link";

export function ReviewSuggestionBanner({ count }: { count: number }) {
  return (
    <Link
      href="/portal/study?mode=review"
      className="block rounded-xl bg-amber-50 border border-amber-200
        p-4 hover:bg-amber-100 transition-colors mb-4"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full bg-amber-100 flex items-center
            justify-center shrink-0"
        >
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            Hora de reforzar
          </p>
          <p className="text-xs text-amber-600">
            Tienes {count} {count === 1 ? "concepto" : "conceptos"} para repasar
            antes de continuar con nuevos temas.
          </p>
        </div>
        <svg
          className="w-5 h-5 text-amber-400 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
