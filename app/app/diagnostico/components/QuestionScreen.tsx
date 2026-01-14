"use client";

import { useState, useEffect } from "react";
import {
  AXIS_NAMES,
  SKILL_NAMES,
  type MSTQuestion,
} from "@/lib/diagnostic/config";

interface QuestionScreenProps {
  question: MSTQuestion;
  questionIndex: number;
  selectedAnswer: string | null;
  isDontKnow: boolean;
  onSelectAnswer: (answer: string) => void;
  onSelectDontKnow: () => void;
  onNext: (correctAnswer: string | null) => void;
}

interface ParsedQuestion {
  html: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
  correctAnswer: string | null;
}

/**
 * Serialize a DOM node to HTML string, preserving MathML
 */
function serializeNodeToHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.localName || el.tagName.toLowerCase();

    // Preserve MathML elements as-is
    if (
      tagName === "math" ||
      el.namespaceURI === "http://www.w3.org/1998/Math/MathML"
    ) {
      return new XMLSerializer().serializeToString(el);
    }

    // Handle images
    if (tagName === "img") {
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "Imagen";
      return `<img src="${src}" alt="${alt}" class="max-w-full rounded-lg my-4" />`;
    }

    // Recursively process children
    let content = "";
    el.childNodes.forEach((child) => {
      content += serializeNodeToHtml(child);
    });

    return content;
  }

  return "";
}

/**
 * Parse QTI XML to extract question content and options
 */
function parseQtiXml(xmlString: string): ParsedQuestion {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Extract question content
  const itemBody = xmlDoc.querySelector("itemBody, qti-item-body");
  const prompt = xmlDoc.querySelector("prompt, qti-prompt");
  const choices = xmlDoc.querySelectorAll("simpleChoice, qti-simple-choice");
  const correctResponse = xmlDoc.querySelector(
    "correctResponse value, qti-correct-response qti-value"
  );

  // Build question HTML preserving MathML
  let html = "";
  if (itemBody) {
    const paragraphs = itemBody.querySelectorAll(":scope > p");
    paragraphs.forEach((p) => {
      const content = serializeNodeToHtml(p);
      html += `<p class="mb-4">${content}</p>`;
    });
  }

  if (prompt) {
    const content = serializeNodeToHtml(prompt);
    html += `<p class="font-semibold mt-4">${content}</p>`;
  }

  // Parse options
  const letters = ["A", "B", "C", "D"];
  const options: ParsedQuestion["options"] = [];

  choices.forEach((choice, index) => {
    const identifier = choice.getAttribute("identifier") || letters[index];

    // Serialize option content, preserving MathML
    const text =
      serializeNodeToHtml(choice).trim() || `Opción ${letters[index]}`;

    options.push({
      letter: letters[index],
      text,
      identifier,
    });
  });

  // Get correct answer identifier
  const correctAnswerIdentifier = correctResponse?.textContent || null;

  // Map identifier to letter
  let correctAnswer: string | null = null;
  if (correctAnswerIdentifier) {
    const correctOption = options.find(
      (o) => o.identifier === correctAnswerIdentifier
    );
    if (correctOption) {
      correctAnswer = correctOption.letter;
    }
  }

  return { html, options, correctAnswer };
}

/**
 * Question display with answer options - fetches real content from DB
 */
export function QuestionScreen({
  question,
  questionIndex,
  selectedAnswer,
  isDontKnow,
  onSelectAnswer,
  onSelectDontKnow,
  onNext,
}: QuestionScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestion, setParsedQuestion] = useState<ParsedQuestion | null>(
    null
  );

  const canProceed = selectedAnswer !== null || isDontKnow;

  // Fetch question content from API
  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          exam: question.exam,
          questionNumber: question.questionNumber,
        });

        const response = await fetch(`/api/diagnostic/question?${params}`);
        const data = await response.json();

        if (data.success && data.question?.qtiXml) {
          const parsed = parseQtiXml(data.question.qtiXml);
          // Use DB correctAnswer if available, fallback to parsed XML
          if (data.question.correctAnswer) {
            parsed.correctAnswer = data.question.correctAnswer;
          }
          setParsedQuestion(parsed);
        } else {
          setError(data.error || "No se pudo cargar la pregunta");
          // Use fallback
          setParsedQuestion(getFallbackQuestion(questionIndex));
        }
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Error de conexión");
        setParsedQuestion(getFallbackQuestion(questionIndex));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [question.exam, question.questionNumber, questionIndex]);

  const handleNext = () => {
    onNext(parsedQuestion?.correctAnswer || null);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6 sm:p-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-cool-gray">Cargando pregunta...</p>
          </div>
        </div>
      </div>
    );
  }

  const options = parsedQuestion?.options || getFallbackOptions();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="card p-6 sm:p-10">
        {/* Question metadata */}
        <div className="flex items-center gap-2 mb-6 text-sm text-cool-gray">
          <span className="px-2 py-1 bg-off-white rounded-md font-medium">
            {AXIS_NAMES[question.axis]}
          </span>
          <span className="px-2 py-1 bg-off-white rounded-md font-medium">
            {SKILL_NAMES[question.skill]}
          </span>
          {error && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs">
              Modo demo
            </span>
          )}
        </div>

        {/* Question content */}
        <div className="prose prose-lg max-w-none mb-8">
          {parsedQuestion?.html ? (
            <div
              className="text-charcoal text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parsedQuestion.html }}
            />
          ) : (
            <p className="text-charcoal text-lg leading-relaxed">
              Pregunta {questionIndex + 1}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {options.map((option) => (
            <button
              key={option.letter}
              onClick={() => onSelectAnswer(option.letter)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                ${
                  selectedAnswer === option.letter
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-200 bg-white hover:border-primary/50 hover:bg-off-white"
                }`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors
                ${selectedAnswer === option.letter ? "bg-primary text-white" : "bg-off-white text-charcoal"}`}
              >
                {option.letter}
              </span>
              <span
                className="text-left text-charcoal"
                dangerouslySetInnerHTML={{ __html: option.text }}
              />
            </button>
          ))}
        </div>

        {/* Don't know button */}
        <button
          onClick={onSelectDontKnow}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all duration-200
            ${
              isDontKnow
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-gray-300 text-cool-gray hover:border-amber-400 hover:bg-amber-50/50"
            }`}
        >
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          No lo sé
        </button>

        {/* Next button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200
              ${
                canProceed
                  ? "btn-primary"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            Siguiente
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback question content when DB fetch fails
 */
function getFallbackQuestion(index: number): ParsedQuestion {
  const questionBank = [
    {
      html: "<p>Si f(x) = 2x² - 3x + 1, ¿cuál es el valor de f(2)?</p>",
      options: ["3", "5", "7", "9"],
    },
    {
      html: "<p>Un rectángulo tiene un perímetro de 24 cm. Si su largo es el doble de su ancho, ¿cuál es su área?</p>",
      options: ["32 cm²", "36 cm²", "40 cm²", "48 cm²"],
    },
    {
      html: "<p>¿Cuál de las siguientes expresiones es equivalente a (x + 2)(x - 3)?</p>",
      options: ["x² - x - 6", "x² + x - 6", "x² - 5x - 6", "x² - x + 6"],
    },
    {
      html: "<p>En una urna hay 4 bolas rojas y 6 bolas azules. Si se extrae una bola al azar, ¿cuál es la probabilidad de que sea roja?</p>",
      options: ["2/5", "3/5", "2/3", "4/6"],
    },
    {
      html: "<p>Si el 30% de un número es 45, ¿cuál es el número?</p>",
      options: ["135", "150", "165", "180"],
    },
    {
      html: "<p>Un triángulo tiene ángulos que miden x°, 2x° y 3x°. ¿Cuál es el valor de x?</p>",
      options: ["20°", "30°", "36°", "45°"],
    },
    {
      html: "<p>¿Cuál es la pendiente de la recta que pasa por los puntos (1, 3) y (4, 9)?</p>",
      options: ["2", "3", "4", "6"],
    },
    {
      html: "<p>Si √(x + 5) = 4, ¿cuál es el valor de x?</p>",
      options: ["9", "11", "16", "21"],
    },
  ];

  const q = questionBank[index % questionBank.length];
  const letters = ["A", "B", "C", "D"];

  return {
    html: q.html,
    options: q.options.map((text, i) => ({
      letter: letters[i],
      text,
      identifier: letters[i],
    })),
    correctAnswer: null, // Unknown in fallback mode
  };
}

function getFallbackOptions() {
  return ["A", "B", "C", "D"].map((letter) => ({
    letter,
    text: `Opción ${letter}`,
    identifier: letter,
  }));
}
