"use client";

import { useState, useEffect } from "react";
import {
  AXIS_NAMES,
  SKILL_NAMES,
  type MSTQuestion,
} from "@/lib/diagnostic/config";

// ============================================================================
// TYPES
// ============================================================================

export interface QuestionAtom {
  atomId: string;
  relevance: "primary" | "secondary";
}

interface QuestionScreenProps {
  question: MSTQuestion;
  questionIndex: number;
  selectedAnswer: string | null;
  isDontKnow: boolean;
  onSelectAnswer: (answer: string) => void;
  onSelectDontKnow: () => void;
  onNext: (correctAnswer: string | null, atoms: QuestionAtom[]) => void;
}

interface ParsedQuestion {
  html: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
  correctAnswer: string | null;
  atoms: QuestionAtom[];
}

// ============================================================================
// QTI PARSING UTILITIES
// ============================================================================

/**
 * Serialize a DOM node to HTML string, preserving MathML and tables
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

    // Preserve table structure with styling
    if (tagName === "table") {
      let content = "";
      el.childNodes.forEach((child) => {
        content += serializeNodeToHtml(child);
      });
      return `<table class="w-full border-collapse border border-gray-300 my-4 text-sm">${content}</table>`;
    }

    // Preserve table elements
    if (["thead", "tbody", "tfoot"].includes(tagName)) {
      let content = "";
      el.childNodes.forEach((child) => {
        content += serializeNodeToHtml(child);
      });
      const bgClass = tagName === "thead" ? ' class="bg-gray-100"' : "";
      return `<${tagName}${bgClass}>${content}</${tagName}>`;
    }

    if (tagName === "tr") {
      let content = "";
      el.childNodes.forEach((child) => {
        content += serializeNodeToHtml(child);
      });
      return `<tr class="border-b border-gray-200">${content}</tr>`;
    }

    if (tagName === "th" || tagName === "td") {
      const colspan = el.getAttribute("colspan");
      const rowspan = el.getAttribute("rowspan");
      let attrs = `class="border border-gray-300 px-3 py-2 ${tagName === "th" ? "font-semibold text-left" : ""}"`;
      if (colspan) attrs += ` colspan="${colspan}"`;
      if (rowspan) attrs += ` rowspan="${rowspan}"`;
      let content = "";
      el.childNodes.forEach((child) => {
        content += serializeNodeToHtml(child);
      });
      return `<${tagName} ${attrs}>${content}</${tagName}>`;
    }

    // Handle div containers
    if (tagName === "div") {
      let content = "";
      el.childNodes.forEach((child) => {
        content += serializeNodeToHtml(child);
      });
      return `<div class="my-4">${content}</div>`;
    }

    // Recursively process children for other elements
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

  // Build question HTML preserving MathML, tables, and other content
  let html = "";
  if (itemBody) {
    // Process all direct children except choice-interaction elements
    itemBody.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tagName = el.localName || el.tagName.toLowerCase();
        // Skip QTI interaction elements - these are handled separately
        if (
          tagName === "qti-choice-interaction" ||
          tagName === "choiceinteraction"
        ) {
          return;
        }
      }
      const content = serializeNodeToHtml(child);
      if (content.trim()) {
        // Wrap loose text/content in paragraph if not already wrapped
        if (
          child.nodeType === Node.ELEMENT_NODE &&
          ["p", "div", "table"].includes(
            (
              (child as Element).localName || (child as Element).tagName
            ).toLowerCase()
          )
        ) {
          html += content;
        } else if (content.trim()) {
          html += `<p class="mb-4">${content}</p>`;
        }
      }
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

  return { html, options, correctAnswer, atoms: [] };
}

// ============================================================================
// OPTION BUTTON COMPONENT
// ============================================================================

function OptionButton({
  letter,
  text,
  isSelected,
  onClick,
  index,
}: {
  letter: string;
  text: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100 + index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all duration-300
        transform ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
        ${
          isSelected
            ? "border-primary bg-primary/5 shadow-lg scale-[1.02] ring-4 ring-primary/10"
            : "border-gray-200 bg-white hover:border-primary/50 hover:bg-off-white hover:shadow-md"
        }`}
    >
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shrink-0 
          transition-all duration-300
          ${
            isSelected
              ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-md scale-110"
              : "bg-off-white text-charcoal group-hover:bg-primary/10"
          }`}
      >
        {letter}
      </span>
      <span
        className="text-left text-charcoal flex-1"
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {isSelected && (
        <svg
          className="w-6 h-6 text-primary shrink-0 animate-scale-in"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
  const [isExiting, setIsExiting] = useState(false);

  const canProceed = selectedAnswer !== null || isDontKnow;

  // Fetch question content from API
  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);
      setIsExiting(false);

      try {
        const params = new URLSearchParams({
          exam: question.exam,
          questionNumber: question.questionNumber,
        });

        const response = await fetch(`/api/diagnostic/question?${params}`);
        const data = await response.json();

        if (data.success && data.question?.qtiXml) {
          const parsed = parseQtiXml(data.question.qtiXml);
          if (data.question.correctAnswer) {
            parsed.correctAnswer = data.question.correctAnswer;
          }
          parsed.atoms = data.question.atoms || [];
          setParsedQuestion(parsed);
        } else {
          setError(data.error || "No se pudo cargar la pregunta");
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
    setIsExiting(true);
    setTimeout(() => {
      onNext(
        parsedQuestion?.correctAnswer || null,
        parsedQuestion?.atoms || []
      );
    }, 200);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6 sm:p-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-cool-gray font-medium">Cargando pregunta...</p>
          </div>
        </div>
      </div>
    );
  }

  const options = parsedQuestion?.options || getFallbackOptions();

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-8 transition-all duration-300
        ${isExiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}`}
    >
      <div className="card p-6 sm:p-10 relative overflow-hidden">
        {/* Decorative corner gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />

        {/* Question metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm relative">
          <span className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 text-primary rounded-lg font-medium border border-primary/10">
            {AXIS_NAMES[question.axis]}
          </span>
          <span className="px-3 py-1.5 bg-gradient-to-r from-accent/10 to-accent/5 text-accent-dark rounded-lg font-medium border border-accent/10">
            {SKILL_NAMES[question.skill]}
          </span>
          {error && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
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

        {/* Options with staggered animation */}
        <div className="space-y-3 mb-8">
          {options.map((option, index) => (
            <OptionButton
              key={option.letter}
              letter={option.letter}
              text={option.text}
              isSelected={selectedAnswer === option.letter}
              onClick={() => onSelectAnswer(option.letter)}
              index={index}
            />
          ))}
        </div>

        {/* Don't know button */}
        <button
          onClick={onSelectDontKnow}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed 
            transition-all duration-300
            ${
              isDontKnow
                ? "border-amber-500 bg-amber-50 text-amber-700 shadow-md scale-[1.01]"
                : "border-gray-300 text-cool-gray hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600"
            }`}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isDontKnow ? "rotate-12" : ""}`}
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
            className={`group px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300
              ${
                canProceed
                  ? "btn-primary shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            Siguiente
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${canProceed ? "group-hover:translate-x-1" : ""}`}
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

// ============================================================================
// FALLBACK DATA
// ============================================================================

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
    correctAnswer: null,
    atoms: [],
  };
}

function getFallbackOptions() {
  return ["A", "B", "C", "D"].map((letter) => ({
    letter,
    text: `Opción ${letter}`,
    identifier: letter,
  }));
}
