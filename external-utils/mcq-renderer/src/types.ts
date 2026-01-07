/**
 * Types for MCQ QTI Renderer
 * 
 * Minimal type definitions for rendering QTI 3.0 Multiple Choice Questions.
 */

/**
 * QTI Data structure for MCQ questions
 * Contains all information needed to render a multiple choice question
 */
export interface MCQData {
  /** Unique identifier for the question */
  identifier: string;
  /** Question title (optional, for display) */
  title?: string;
  /** Question type - always 'choice' for MCQ */
  type: 'choice';
  /** Raw QTI XML content */
  rawXml: string;
  /** Response declarations parsed from XML */
  responseDeclarations?: ResponseDeclaration[];
  /** Outcome declarations for scoring */
  outcomeDeclarations?: OutcomeDeclaration[];
  /** Response processing rules */
  responseProcessing?: ResponseProcessing;
}

/**
 * Response declaration defines what a correct response looks like
 */
export interface ResponseDeclaration {
  identifier: string;
  cardinality: 'single' | 'multiple' | 'ordered';
  baseType: string;
  correctValues: string[];
  defaultValues?: string[];
  mapping?: Record<string, number>;
  defaultValue?: number;
}

/**
 * Outcome declaration defines potential outcomes of a response
 */
export interface OutcomeDeclaration {
  identifier: string;
  cardinality: string;
  baseType: string;
}

/**
 * Response processing configuration
 */
export interface ResponseProcessing {
  templateType?: string;
  outcomeIdentifier?: string;
  correctResponseIdentifier?: string;
  incorrectResponseIdentifier?: string;
  responseDeclarationIdentifier?: string;
}

/**
 * Validation state for the current response
 */
export interface ValidationState {
  /** Whether the current selection meets minimum requirements */
  isValid: boolean;
  /** Minimum number of selections required */
  minRequired: number;
  /** Maximum number of selections allowed (optional) */
  maxAllowed?: number;
}

/**
 * Props for the MCQ Renderer component
 */
export interface MCQRendererProps {
  /** QTI XML string for the MCQ question */
  qtiXml: string;
  /** Callback when answer selection changes */
  onAnswerChange?: (answers: Record<string, string | string[]>) => void;
  /** Callback when user submits their answer */
  onSubmit?: (result: SubmitResult) => void;
  /** Whether to show feedback after submission */
  showFeedback?: boolean;
  /** Whether the question is disabled (read-only) */
  disabled?: boolean;
  /** Initial selected answers (for restoring state) */
  initialAnswers?: Record<string, string | string[]>;
  /** Custom class name for the container */
  className?: string;
}

/**
 * Result returned when submitting an answer
 */
export interface SubmitResult {
  /** Response identifier */
  identifier: string;
  /** Selected answer value(s) */
  value: string | string[];
  /** Whether the answer is correct */
  isCorrect: boolean;
  /** All answers mapped by identifier */
  allAnswers: Record<string, string | string[]>;
}

