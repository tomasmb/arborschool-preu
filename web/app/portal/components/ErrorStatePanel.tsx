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
  retryLabel = "Intentar de nuevo",
  secondaryHref = "/portal",
  secondaryLabel = "Ir al inicio",
}: ErrorStatePanelProps) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4">
      <p className="text-sm text-red-800">{message}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary text-sm bg-red-700 hover:bg-red-800"
        >
          {retryLabel}
        </button>
        <Link href={secondaryHref} className="btn-secondary">
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}
