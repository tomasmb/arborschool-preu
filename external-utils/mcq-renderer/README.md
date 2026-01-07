# MCQ QTI Renderer

A standalone Multiple Choice Question (MCQ) renderer for QTI 3.0 format questions.

## Features

- **QTI 3.0 Compliant**: Renders questions following the QTI 3.0 specification
- **Single & Multiple Choice**: Supports both single-select and multi-select questions
- **Inline Feedback**: Displays per-choice feedback after submission
- **Modal Feedback**: Shows correct/incorrect modal feedback
- **MathML Support**: Renders mathematical notation
- **Shuffle Support**: Respects QTI shuffle attribute
- **Lightweight**: Minimal dependencies, focused only on MCQ rendering

## Quick Start

### Installation

```bash
cd mcq-renderer
npm install
```

### Run the Demo

```bash
npm run dev
```

Open http://localhost:5173 in your browser to see the demo.

### Build for Production

```bash
npm run build
```

## Usage

### Basic Usage

```tsx
import { MCQRenderer } from './src';

function MyComponent() {
  const qtiXml = `<?xml version="1.0" encoding="UTF-8"?>
    <qti-assessment-item 
      xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
      identifier="my-question"
      title="Sample Question"
      adaptive="false"
      time-dependent="false">
      
      <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
        <qti-correct-response>
          <qti-value>A</qti-value>
        </qti-correct-response>
      </qti-response-declaration>
      
      <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
        <qti-default-value>
          <qti-value>0</qti-value>
        </qti-default-value>
      </qti-outcome-declaration>
      
      <qti-item-body>
        <p>What is 2 + 2?</p>
        <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
          <qti-simple-choice identifier="A">4</qti-simple-choice>
          <qti-simple-choice identifier="B">3</qti-simple-choice>
          <qti-simple-choice identifier="C">5</qti-simple-choice>
        </qti-choice-interaction>
      </qti-item-body>
      
      <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>
    </qti-assessment-item>`;

  const handleSubmit = (result) => {
    console.log('Answer submitted:', result);
    console.log('Is correct:', result.isCorrect);
  };

  return (
    <MCQRenderer
      qtiXml={qtiXml}
      onSubmit={handleSubmit}
    />
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `qtiXml` | `string` | **Required**. The QTI XML string for the question |
| `onAnswerChange` | `(answers: Record<string, string \| string[]>) => void` | Callback when answer selection changes |
| `onSubmit` | `(result: SubmitResult) => void` | Callback when user submits their answer |
| `showFeedback` | `boolean` | Override to control when feedback is shown |
| `disabled` | `boolean` | Override to disable/enable the question |
| `initialAnswers` | `Record<string, string \| string[]>` | Initial selected answers (for restoring state) |
| `className` | `string` | Custom class name for the container |

### SubmitResult Type

```typescript
interface SubmitResult {
  identifier: string;           // Response identifier
  value: string | string[];     // Selected answer value(s)
  isCorrect: boolean;           // Whether the answer is correct
  allAnswers: Record<string, string | string[]>; // All answers
}
```

## QTI XML Structure

### Single Choice Question

```xml
<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
  <qti-correct-response>
    <qti-value>A</qti-value>
  </qti-correct-response>
</qti-response-declaration>

<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
  <qti-simple-choice identifier="A">Option A</qti-simple-choice>
  <qti-simple-choice identifier="B">Option B</qti-simple-choice>
</qti-choice-interaction>
```

### Multiple Choice Question

```xml
<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
  <qti-correct-response>
    <qti-value>A</qti-value>
    <qti-value>C</qti-value>
  </qti-correct-response>
</qti-response-declaration>

<qti-choice-interaction response-identifier="RESPONSE" max-choices="0" min-choices="1">
  <qti-simple-choice identifier="A">Option A (correct)</qti-simple-choice>
  <qti-simple-choice identifier="B">Option B</qti-simple-choice>
  <qti-simple-choice identifier="C">Option C (correct)</qti-simple-choice>
</qti-choice-interaction>
```

### With Inline Feedback

```xml
<qti-simple-choice identifier="A">
  Option A
  <qti-feedback-inline outcome-identifier="RESPONSE" identifier="A" show-hide="show">
    This is feedback for option A.
  </qti-feedback-inline>
</qti-simple-choice>
```

## Styling

The renderer uses styles from `@alphalearn/qti-renderer`. Make sure to import the styles:

```tsx
import '@alphalearn/qti-renderer/styles.css';
```

You can customize the appearance by:
1. Adding custom CSS classes via the `className` prop
2. Overriding the QTI renderer CSS variables
3. Using CSS cascade to override specific styles

## File Structure

```
mcq-renderer/
├── src/
│   ├── App.tsx           # Demo application
│   ├── MCQRenderer.tsx   # Main MCQ renderer component
│   ├── main.tsx          # Entry point
│   ├── index.ts          # Public exports
│   ├── types.ts          # TypeScript types
│   └── styles.css        # Demo styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT

