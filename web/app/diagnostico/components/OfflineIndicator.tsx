"use client";

import { useEffect, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface OfflineIndicatorProps {
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Subtle fixed indicator shown when operating in offline/local storage mode.
 * Non-intrusive but informative for users. Dismissible.
 */
export function OfflineIndicator({ className = "" }: OfflineIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Fade in after mount for smoother appearance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${className}`}
    >
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl shadow-lg">
        {/* Cloud offline icon */}
        <div className="shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364L5.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            Modo sin conexión
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Tus respuestas se guardan localmente y se sincronizarán después.
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso de modo sin conexión"
          className="shrink-0 w-8 h-8 flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded transition-colors"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
