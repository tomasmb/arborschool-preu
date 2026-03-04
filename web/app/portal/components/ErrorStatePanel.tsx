"use client";

import Link from "next/link";

type ErrorStatePanelProps = {
  message: string;
  retryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ErrorStatePanel({
  message,
  retryLabel = "Reintentar",
  secondaryHref = "/portal",
  secondaryLabel = "Volver al portal",
}: ErrorStatePanelProps) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4">
      <p className="text-sm text-red-800">{message}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          {retryLabel}
        </button>
        <Link
          href={secondaryHref}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}
