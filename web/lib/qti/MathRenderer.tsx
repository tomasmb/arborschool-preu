"use client";

import { MathJaxContext, MathJax } from "better-react-mathjax";
import { type ReactNode } from "react";

/**
 * MathJax config: only process MathML markup (`<math>`) and render via CHTML.
 * Loads lazily from CDN — no cost on pages that never mount a <MathJax>.
 */
const MATHJAX_CONFIG = {
  loader: { load: ["input/mathml", "output/chtml"] },
  options: { enableMenu: false },
};

/**
 * Wrap a subtree so any nested `<MathJax>` components can resolve the context.
 * Place this once per route group (portal, diagnostico) via a layout.
 */
export function MathProvider({ children }: { children: ReactNode }) {
  return <MathJaxContext config={MATHJAX_CONFIG}>{children}</MathJaxContext>;
}

/**
 * Drop-in replacement for `<div dangerouslySetInnerHTML={{ __html }} />`.
 * Automatically typesets any `<math>` elements found in the HTML.
 */
export function MathContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <MathJax>
      <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
    </MathJax>
  );
}
