"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Text to show while loading (optional, shows spinner only if not provided) */
  loadingText?: string;
  /** Button content when not loading */
  children: ReactNode;
}

// ============================================================================
// SPINNER COMPONENT
// ============================================================================

function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div
      className={`${className} border-2 border-current/30 border-t-current rounded-full animate-spin`}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * A button component with built-in loading state support.
 * Automatically disables the button and shows a spinner when loading.
 *
 * Works with existing button styles (btn-cta, btn-primary, btn-ghost).
 *
 * @example
 * <LoadingButton
 *   onClick={handleSubmit}
 *   isLoading={isSubmitting}
 *   loadingText="Guardando..."
 *   className="btn-cta w-full py-4"
 * >
 *   Guardar
 * </LoadingButton>
 */
export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  // Combine disabled states: explicit disabled OR loading
  const isDisabled = disabled || isLoading;

  // Add disabled styles when loading
  const buttonClassName = `${className} ${
    isLoading
      ? "disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100"
      : ""
  }`.trim();

  return (
    <button disabled={isDisabled} className={buttonClassName} {...props}>
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner />
          {loadingText && <span>{loadingText}</span>}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
