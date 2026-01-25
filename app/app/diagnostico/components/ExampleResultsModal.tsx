"use client";

/**
 * Example Results Preview Modal
 *
 * Shows a preview of what diagnostic results look like to reduce uncertainty
 * before users commit time. Follows the conversion optimization spec.
 *
 * @see temp-docs/conversion-optimization-implementation.md#implementation-example-preview-modal
 */

import React, { useEffect, useState } from "react";
import { Icons } from "./shared";

interface ExampleResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDiagnostic: () => void;
}

// ============================================================================
// EXAMPLE DATA (Illustrative values - consistent single route message)
// ============================================================================

const EXAMPLE_DATA = {
  scoreMin: 650,
  scoreMax: 720,
  topRoute: {
    name: "Geometría",
    questionsUnlocked: 12,
    pointsGain: 48,
    studyHours: 4, // ~12 atoms × 20 min = 4 hours
  },
  lowHangingFruit: 5,
};

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto
          transition-all duration-300 transform
          ${showContent ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full 
            bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          aria-label="Cerrar"
        >
          <svg
            className="w-4 h-4 text-cool-gray"
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

        <div className="p-6 sm:p-8">
          {/* Header */}
          <h2
            id="modal-title"
            className="text-xl sm:text-2xl font-serif font-bold text-charcoal mb-6 pr-8"
          >
            Así se verán tus resultados
          </h2>

          {/* Score Preview Card */}
          <div className="bg-gradient-to-br from-cream to-off-white rounded-xl p-5 mb-5 border border-gray-100">
            <p className="text-sm text-cool-gray mb-2 text-center">
              Tu Puntaje PAES Estimado
            </p>
            <div className="text-4xl sm:text-5xl font-bold text-primary text-center mb-2">
              {EXAMPLE_DATA.scoreMin}-{EXAMPLE_DATA.scoreMax}
            </div>

            {/* Key Value Proposition: X points in Y hours */}
            <div className="flex items-center justify-center gap-2 mt-4 text-charcoal">
              {Icons.trendUp("w-5 h-5 text-success")}
              <span>
                Podrías subir{" "}
                <strong className="text-success">
                  +{EXAMPLE_DATA.topRoute.pointsGain} puntos
                </strong>{" "}
                en{" "}
                <strong className="text-charcoal">
                  ~{EXAMPLE_DATA.topRoute.studyHours} horas
                </strong>
              </span>
            </div>
          </div>

          {/* Route Preview */}
          <p className="text-sm text-cool-gray mb-2">
            Tu ruta de mayor impacto:
          </p>
          <div className="card p-4 mb-5 border-primary/20 bg-gradient-to-br from-primary/5 to-white">
            <div className="flex items-center gap-2 mb-2">
              {Icons.star("w-4 h-4 text-primary")}
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Recomendado
              </span>
            </div>
            <h4 className="font-bold text-charcoal mb-2">
              {EXAMPLE_DATA.topRoute.name}
            </h4>

            {/* Key value proposition: points + time */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-success font-bold text-lg">
                +{EXAMPLE_DATA.topRoute.pointsGain} puntos
              </span>
              <span className="text-cool-gray">en</span>
              <span className="text-charcoal font-semibold">
                ~{EXAMPLE_DATA.topRoute.studyHours} horas
              </span>
            </div>

            {/* Secondary: questions unlocked */}
            <div className="flex items-center gap-2 text-sm text-cool-gray">
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
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              <span>
                +{EXAMPLE_DATA.topRoute.questionsUnlocked} preguntas PAES
              </span>
            </div>
          </div>

          {/* Low Hanging Fruit */}
          <div className="flex items-center gap-2 text-sm text-cool-gray mb-6">
            {Icons.lightbulb("w-4 h-4 text-success")}
            <span>
              <strong className="text-success">
                {EXAMPLE_DATA.lowHangingFruit}
              </strong>{" "}
              preguntas a solo 1 concepto de distancia.
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={onStartDiagnostic}
            className="btn-cta w-full py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] 
              transition-all duration-300 flex items-center justify-center gap-2"
          >
            Descubrir mi puntaje real
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>

          {/* Features Line */}
          <p className="text-xs text-cool-gray text-center mt-4">
            16 preguntas · ~15 min · Puntaje inmediato · Guardas tu progreso ·
            Continuación cuando lancemos
          </p>

          {/* Disclaimer */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-cool-gray">
            <svg
              className="w-3 h-3"
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
            <span>Ejemplo ilustrativo. Tu resultado será personalizado.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
