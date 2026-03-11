"use client";

import { MathJaxContext, MathJax } from "better-react-mathjax";
import { type ReactNode } from "react";

/**
 * MathJax v3 all-in-one bundle for MathML → CHTML.
 * Pinned to v3 because better-react-mathjax@3 defaults to MathJax v4 whose
 * CDN module paths (`input/mathml.js`) don't resolve on jsdelivr.
 */
const MATHJAX_SRC = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/mml-chtml.js";

const MATHJAX_CONFIG = {
  options: { enableMenu: false },
};

/**
 * Wrap a subtree so any nested `<MathJax>` components can resolve the context.
 * Place this once per route group (portal, diagnostico) via a layout.
 */
export function MathProvider({ children }: { children: ReactNode }) {
  return (
    <MathJaxContext version={3} src={MATHJAX_SRC} config={MATHJAX_CONFIG}>
      {children}
    </MathJaxContext>
  );
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
