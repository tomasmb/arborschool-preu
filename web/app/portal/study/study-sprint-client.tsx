"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AtomStudyView } from "./AtomStudyView";
import { PrereqScanView } from "./PrereqScanView";
import { ReviewSessionView } from "./ReviewSessionView";
import { VerificationView } from "./VerificationView";
import { useAtomStudyController } from "./useAtomStudyController";
import { usePrereqScanController } from "./usePrereqScanController";
import { useReviewSessionController } from "./useReviewSessionController";
import { useVerificationController } from "./useVerificationController";

/**
 * Atom-based study flow. Activated when URL has `?atom=ATOM_ID`.
 */
function AtomStudyClient({ atomId }: { atomId: string }) {
  const ctrl = useAtomStudyController(atomId);
  return <AtomStudyView ctrl={ctrl} />;
}

/**
 * Spaced-repetition review flow. Activated via `?mode=review`.
 */
function ReviewStudyClient() {
  const ctrl = useReviewSessionController();
  return <ReviewSessionView ctrl={ctrl} />;
}

/**
 * Verification quiz flow. Activated via `?mode=verification`.
 * Quick check for atoms flagged after a full test discrepancy.
 */
function VerificationClient() {
  const ctrl = useVerificationController();
  return <VerificationView ctrl={ctrl} />;
}

/**
 * Prerequisite scan flow. Activated via `?scan=SESSION_ID`.
 */
function ScanStudyClient({ scanSessionId }: { scanSessionId: string }) {
  const ctrl = usePrereqScanController(scanSessionId);
  return <PrereqScanView ctrl={ctrl} />;
}

/**
 * Redirect to dashboard when no recognized study param is present.
 */
function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/portal");
  }, [router]);
  return null;
}

export function StudySprintClient() {
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");
  if (mode === "review") {
    return <ReviewStudyClient />;
  }
  if (mode === "verification") {
    return <VerificationClient />;
  }

  const scanSessionId = searchParams.get("scan");
  if (scanSessionId) {
    return <ScanStudyClient scanSessionId={scanSessionId} />;
  }

  const atomIdFromUrl = searchParams.get("atom");
  if (atomIdFromUrl) {
    return <AtomStudyClient atomId={atomIdFromUrl} />;
  }

  return <RedirectToDashboard />;
}
