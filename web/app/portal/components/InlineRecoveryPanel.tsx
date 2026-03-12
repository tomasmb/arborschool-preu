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
  retryLabel = "Intentar de nuevo",
  secondaryHref = "/portal",
  secondaryLabel = "Ir al inicio",
  showSecondaryAction = true,
}: InlineRecoveryPanelProps) {
  const studentMessage = toStudentSafeMessage(
    message,
    "Algo falló. Espera un momento y prueba de nuevo."
  );

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-sm text-red-700">{studentMessage}</p>
      <div className="flex flex-wrap gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary text-sm bg-red-700 hover:bg-red-800"
          >
            {retryLabel}
          </button>
        ) : null}
        {showSecondaryAction ? (
          <Link href={secondaryHref} className="btn-secondary">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
