/**
 * MCQ Renderer Demo App
 * 
 * Demonstrates the standalone MCQ QTI renderer with example questions.
 * This app shows how to integrate the MCQRenderer component.
 */

import { useState, useCallback } from 'react';
import { MCQRenderer } from './MCQRenderer';
import type { SubmitResult } from './types';

// Example QTI questions for demonstration
const EXAMPLE_QUESTIONS = [
  {
    id: 'single-choice',
    title: 'Single Choice Question',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item 
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="single-choice-1"
  title="Capital Cities"
  adaptive="false"
  time-dependent="false">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>B</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  
  <qti-item-body>
    <p>What is the capital of France?</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="A">London</qti-simple-choice>
      <qti-simple-choice identifier="B">Paris</qti-simple-choice>
      <qti-simple-choice identifier="C">Berlin</qti-simple-choice>
      <qti-simple-choice identifier="D">Madrid</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`,
  },
  {
    id: 'multiple-choice',
    title: 'Multiple Choice Question',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item 
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="multiple-choice-1"
  title="Prime Numbers"
  adaptive="false"
  time-dependent="false">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>A</qti-value>
      <qti-value>B</qti-value>
      <qti-value>D</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  
  <qti-item-body>
    <p>Select <strong>all</strong> prime numbers from the following list:</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="0" min-choices="1">
      <qti-simple-choice identifier="A">2</qti-simple-choice>
      <qti-simple-choice identifier="B">3</qti-simple-choice>
      <qti-simple-choice identifier="C">4</qti-simple-choice>
      <qti-simple-choice identifier="D">5</qti-simple-choice>
      <qti-simple-choice identifier="E">6</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`,
  },
  {
    id: 'with-feedback',
    title: 'Question with Inline Feedback',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item 
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="feedback-choice-1"
  title="Science Question"
  adaptive="false"
  time-dependent="false">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>C</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  
  <qti-item-body>
    <p>Which planet is known as the "Red Planet"?</p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="A">
        Venus
        <qti-feedback-inline outcome-identifier="RESPONSE" identifier="A" show-hide="show">
          Venus is sometimes called Earth's sister planet due to similar size.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="B">
        Jupiter
        <qti-feedback-inline outcome-identifier="RESPONSE" identifier="B" show-hide="show">
          Jupiter is the largest planet in our solar system.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="C">
        Mars
        <qti-feedback-inline outcome-identifier="RESPONSE" identifier="C" show-hide="show">
          Correct! Mars appears red due to iron oxide (rust) on its surface.
        </qti-feedback-inline>
      </qti-simple-choice>
      <qti-simple-choice identifier="D">
        Saturn
        <qti-feedback-inline outcome-identifier="RESPONSE" identifier="D" show-hide="show">
          Saturn is known for its distinctive ring system.
        </qti-feedback-inline>
      </qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  
  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
    <qti-content-body>
      <p>Well done! You selected the correct answer.</p>
    </qti-content-body>
  </qti-modal-feedback>
  
  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
    <qti-content-body>
      <p>That's not quite right. Mars is called the Red Planet.</p>
    </qti-content-body>
  </qti-modal-feedback>
  
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-base-value base-type="identifier">correct</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-base-value base-type="identifier">incorrect</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`,
  },
  {
    id: 'math-question',
    title: 'Math Question with MathML',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item 
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="math-choice-1"
  title="Algebra Question"
  adaptive="false"
  time-dependent="false">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>B</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  
  <qti-item-body>
    <p>Solve for x: <math xmlns="http://www.w3.org/1998/Math/MathML"><mn>2</mn><mi>x</mi><mo>+</mo><mn>4</mn><mo>=</mo><mn>10</mn></math></p>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="A">x = 2</qti-simple-choice>
      <qti-simple-choice identifier="B">x = 3</qti-simple-choice>
      <qti-simple-choice identifier="C">x = 4</qti-simple-choice>
      <qti-simple-choice identifier="D">x = 7</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  
  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`,
  },
];

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastResult, setLastResult] = useState<SubmitResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const currentQuestion = EXAMPLE_QUESTIONS[currentIndex];

  // Handle navigation
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setLastResult(null);
    setAnswers({});
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(EXAMPLE_QUESTIONS.length - 1, prev + 1));
    setLastResult(null);
    setAnswers({});
  }, []);

  // Handle answer changes
  const handleAnswerChange = useCallback((newAnswers: Record<string, string | string[]>) => {
    setAnswers(newAnswers);
  }, []);

  // Handle submission
  const handleSubmit = useCallback((result: SubmitResult) => {
    setLastResult(result);
    console.log('Question submitted:', result);
  }, []);

  return (
    <div className="mcq-demo-container">
      {/* Header */}
      <header className="mcq-demo-header">
        <h1>MCQ QTI Renderer</h1>
        <p>Standalone Multiple Choice Question renderer using QTI 3.0 standard</p>
      </header>

      {/* Navigation */}
      <nav className="mcq-navigation">
        <button
          className="mcq-nav-button"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <span className="mcq-question-counter">
          {currentIndex + 1} / {EXAMPLE_QUESTIONS.length}
        </span>
        <button
          className="mcq-nav-button"
          onClick={goToNext}
          disabled={currentIndex === EXAMPLE_QUESTIONS.length - 1}
        >
          Next →
        </button>
      </nav>

      {/* Question Card */}
      <div className="mcq-question-card">
        <h2 className="mcq-question-title">{currentQuestion.title}</h2>
        
        <MCQRenderer
          key={currentQuestion.id}
          qtiXml={currentQuestion.xml}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Debug Panel */}
      <div className="mcq-debug-panel">
        <h3>Debug Info</h3>
        <pre>
          {JSON.stringify(
            {
              questionId: currentQuestion.id,
              currentAnswers: answers,
              lastSubmitResult: lastResult,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

export default App;

