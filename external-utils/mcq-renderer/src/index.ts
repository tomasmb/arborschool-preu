/**
 * MCQ QTI Renderer - Public API
 * 
 * This file exports all public components and types from the MCQ renderer.
 * Import from this file when using the renderer in other projects.
 * 
 * @example
 * ```ts
 * import { MCQRenderer } from './mcq-renderer';
 * import type { MCQRendererProps, SubmitResult } from './mcq-renderer';
 * ```
 */

// Main component
export { MCQRenderer, default as MCQRendererDefault } from './MCQRenderer';

// Types
export type {
  MCQData,
  MCQRendererProps,
  ResponseDeclaration,
  OutcomeDeclaration,
  ResponseProcessing,
  ValidationState,
  SubmitResult,
} from './types';

