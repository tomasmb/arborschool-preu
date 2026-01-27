"use client";

/**
 * Example Results Preview Modal
 *
 * Shows a preview of what diagnostic results look like using the actual
 * ResultsScreen component with pre-computed data. This ensures the example
 * is always aligned with the real results page.
 *
 * Uses static pre-computed data to avoid API calls and DB queries.
 *
 * @see app/diagnostico/data/exampleResultsData.ts for the pre-computed data
 */

import React, { useEffect, useState } from "react";
import { ResultsScreen } from "./ResultsScreen";
import {
  EXAMPLE_RESULTS,
  EXAMPLE_TOTAL_CORRECT,
  EXAMPLE_ROUTES_DATA,
  EXAMPLE_NEXT_CONCEPTS,
} from "../data/exampleResultsData";

interface ExampleResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDiagnostic: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExampleResultsModal({
  isOpen,
  onClose,
  onStartDiagnostic,
}: ExampleResultsModalProps) {
  const [showContent, setShowContent] = useState(false);

  // Animation timing
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity duration-300
          ${showContent ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content Container */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] 
          overflow-hidden transition-all duration-300 transform mx-4
          ${showContent ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full 
            bg-white/90 hover:bg-white shadow-md hover:shadow-lg transition-all z-30"
          aria-label="Cerrar"
        >
          <svg
            className="w-5 h-5 text-cool-gray"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Example Badge */}
        <div className="absolute top-4 left-4 z-30">
          <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Ejemplo ilustrativo</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[95vh]">
          {/* ResultsScreen with pre-computed data */}
          <ExampleResultsContent onStartDiagnostic={onStartDiagnostic} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE RESULTS CONTENT
// ============================================================================

/**
 * Wraps ResultsScreen with example-specific overrides:
 * - Uses pre-computed routes data (no API calls)
 * - Custom CTA that triggers diagnostic start
 * - Hides question review (no real questions to show)
 */
function ExampleResultsContent({
  onStartDiagnostic,
}: {
  onStartDiagnostic: () => void;
}) {
  return (
    <div className="example-results-wrapper">
      <ResultsScreen
        results={EXAMPLE_RESULTS}
        route="B"
        totalCorrect={EXAMPLE_TOTAL_CORRECT}
        atomResults={[]}
        responses={[]}
        onSignup={onStartDiagnostic}
        precomputedRoutes={EXAMPLE_ROUTES_DATA}
        precomputedNextConcepts={EXAMPLE_NEXT_CONCEPTS}
      />

      {/* Override styles for example mode */}
      <style jsx global>{`
        /* Hide confetti in example mode */
        .example-results-wrapper canvas {
          display: none !important;
        }

        /* Adjust header for modal context */
        .example-results-wrapper header {
          position: relative !important;
          top: 0 !important;
        }
      `}</style>
    </div>
  );
}
