/**
 * MCQ Renderer Component
 * 
 * A standalone component for rendering QTI 3.0 Multiple Choice Questions.
 * Uses the @alphalearn/qti-renderer package for core rendering functionality.
 * 
 * Features:
 * - Parses QTI XML and renders choice interactions
 * - Supports single and multiple selection modes
 * - Shows correct/incorrect feedback after submission
 * - Handles shuffle and other QTI attributes
 * 
 * @example
 * ```tsx
 * <MCQRenderer
 *   qtiXml={qtiXmlString}
 *   onSubmit={(result) => console.log('Submitted:', result)}
 * />
 * ```
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  QuestionRenderer,
  parseToAST,
  evaluateResponseProcessing,
  type ValidationState as PackageValidationState,
} from '@alphalearn/qti-renderer';
import type { MCQRendererProps, MCQData, SubmitResult, ValidationState } from './types';

/**
 * MCQRenderer - Renders a QTI 3.0 Multiple Choice Question
 */
export function MCQRenderer({
  qtiXml,
  onAnswerChange,
  onSubmit,
  showFeedback: controlledShowFeedback,
  disabled: controlledDisabled,
  initialAnswers,
  className,
}: MCQRendererProps) {
  // Parse QTI XML to extract question data
  const { qtiData, responseDeclarations, responseProcessing, outcomeDeclarations } = useMemo(() => {
    const parsed = parseToAST(qtiXml);
    
    const data: MCQData = {
      identifier: parsed.assessmentItemMetadata?.identifier || 'mcq-question',
      title: parsed.assessmentItemMetadata?.title,
      type: 'choice',
      rawXml: qtiXml,
      responseDeclarations: parsed.responseDeclarations?.map(rd => ({
        identifier: rd.identifier,
        baseType: rd.baseType,
        cardinality: rd.cardinality as 'single' | 'multiple' | 'ordered',
        correctValues: rd.correctValues || [],
      })),
      outcomeDeclarations: parsed.outcomeDeclarations,
      responseProcessing: parsed.responseProcessing,
    };

    return {
      qtiData: data,
      responseDeclarations: parsed.responseDeclarations || [],
      responseProcessing: parsed.responseProcessing,
      outcomeDeclarations: parsed.outcomeDeclarations || [],
    };
  }, [qtiXml]);

  // State for answers and submission
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialAnswers || {});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ isValid: false, minRequired: 0 });

  // Sync initial answers when they change
  useEffect(() => {
    if (initialAnswers) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  // Determine showFeedback and disabled states
  const showFeedback = controlledShowFeedback !== undefined ? controlledShowFeedback : isSubmitted;
  const disabled = controlledDisabled !== undefined ? controlledDisabled : isSubmitted;

  // Handle answer changes from the renderer
  const handleAnswerChange = useCallback((newAnswers: Record<string, string | string[]>) => {
    if (disabled) return;
    
    setAnswers(newAnswers);
    onAnswerChange?.(newAnswers);
  }, [disabled, onAnswerChange]);

  // Handle validation state changes
  const handleValidationChange = useCallback((state: PackageValidationState) => {
    setValidation({
      isValid: state.isValid,
      minRequired: state.minRequired,
      maxAllowed: state.maxAllowed,
    });
  }, []);

  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!validation.isValid || isSubmitted) return;

    setIsSubmitted(true);

    // Evaluate correctness using response processing
    let correct = false;

    if (responseDeclarations.length > 0 && responseProcessing) {
      try {
        const { outcomes, isCorrect: evalCorrect } = evaluateResponseProcessing({
          responseProcessing,
          responses: answers,
          responseDeclarations,
          outcomeDeclarations,
        });

        // Check if SCORE outcome indicates correctness
        const score = outcomes?.SCORE;
        if (typeof score === 'number') {
          correct = score > 0;
        } else {
          correct = evalCorrect;
        }
      } catch {
        // Fallback: compare with correct values directly
        correct = responseDeclarations.every(decl => {
          const userVal = answers[decl.identifier];
          const correctVals = decl.correctValues || [];
          if (!userVal) return correctVals.length === 0;
          if (Array.isArray(userVal)) {
            return (
              userVal.length === correctVals.length &&
              userVal.every(v => correctVals.includes(v))
            );
          }
          return correctVals.includes(String(userVal));
        });
      }
    }

    setIsCorrect(correct);

    // Notify parent
    if (onSubmit) {
      const firstDecl = responseDeclarations[0];
      const identifier = firstDecl?.identifier || 'RESPONSE';
      const value = answers[identifier] || '';

      const result: SubmitResult = {
        identifier,
        value,
        isCorrect: correct,
        allAnswers: answers,
      };

      onSubmit(result);
    }
  }, [validation.isValid, isSubmitted, responseDeclarations, responseProcessing, outcomeDeclarations, answers, onSubmit]);

  // Reset function to allow re-answering
  const handleReset = useCallback(() => {
    setAnswers({});
    setIsSubmitted(false);
    setIsCorrect(false);
  }, []);

  return (
    <div className={className}>
      {/* Question Renderer */}
      <QuestionRenderer
        data={qtiData}
        selectedAnswers={answers}
        eliminatedAnswers={[]}
        showFeedback={showFeedback}
        disabled={disabled}
        historicalCorrectness={isCorrect}
        onAnswerChange={handleAnswerChange}
        onValidationChange={handleValidationChange}
        onRequestSubmit={handleSubmit}
      />

      {/* Action Buttons */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        {!isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={!validation.isValid}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: validation.isValid ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: validation.isValid ? 'pointer' : 'not-allowed',
              fontWeight: 500,
            }}
          >
            Submit
          </button>
        )}

        {isSubmitted && (
          <button
            onClick={handleReset}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
        )}
      </div>

      {/* Result Indicator */}
      {isSubmitted && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            backgroundColor: isCorrect ? '#dcfce7' : '#fee2e2',
            color: isCorrect ? '#166534' : '#991b1b',
            fontWeight: 500,
          }}
        >
          {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
        </div>
      )}
    </div>
  );
}

export default MCQRenderer;

