"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";

type NextActionBrief = {
  axis: string;
  firstAtom: { atomId: string; title: string } | null;
};

/**
 * Compact CTA card that fetches the student's next recommended
 * atom and links directly to the study page.
 */
export function NextMiniClaseCTA() {
  const [action, setAction] = useState<NextActionBrief | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/student/next-action", {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = (await res.json()) as ApiEnvelope<{
          nextAction: NextActionBrief | null;
        }>;
        if (!cancelled && json.success && json.data.nextAction) {
          setAction(json.data.nextAction);
        }
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!action?.firstAtom) return null;

  return (
    <section
      className="rounded-2xl border border-primary/20 bg-primary/5 p-4
        flex items-center gap-4"
    >
      <div
        className="w-10 h-10 rounded-full bg-primary/10 flex items-center
          justify-center shrink-0"
      >
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54
              6.347a1.125 1.125 0 0 1 0
              1.972l-11.54 6.347a1.125 1.125 0 0
              1-1.667-.986V5.653Z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          Siguiente paso recomendado
        </p>
        <p className="text-sm font-semibold text-gray-900 truncate">
          {action.firstAtom.title}
        </p>
        <p className="text-xs text-gray-500">
          {action.axis} · Dominar este concepto mejora tu puntaje PAES
        </p>
      </div>
      <Link
        href={`/portal/study?atom=${encodeURIComponent(action.firstAtom.atomId)}`}
        className="btn-primary text-xs px-4 py-2 shrink-0"
      >
        Comenzar
      </Link>
    </section>
  );
}
