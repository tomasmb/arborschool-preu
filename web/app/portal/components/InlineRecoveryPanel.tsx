"use client";

import Link from "next/link";
import { toStudentSafeMessage } from "../errorUtils";

type InlineRecoveryPanelProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  showSecondaryAction?: boolean;
};

export function InlineRecoveryPanel({
  message,
  onRetry,
  retryLabel = "Reintentar",
  secondaryHref = "/portal",
  secondaryLabel = "Volver al portal",
  showSecondaryAction = true,
}: InlineRecoveryPanelProps) {
  const studentMessage = toStudentSafeMessage(
    message,
    "Tuvimos un problema para continuar. Reintenta en unos segundos."
  );

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-sm text-red-700">{studentMessage}</p>
      <div className="flex flex-wrap gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            {retryLabel}
          </button>
        ) : null}
        {showSecondaryAction ? (
          <Link
            href={secondaryHref}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
