"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { type MSTQuestion } from "@/lib/diagnostic/config";
import { QuestionReviewContent } from "./QuestionReviewContent";

// ============================================================================
// TYPES (exported for QuestionReviewContent)
// ============================================================================

export interface ResponseForReview {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
}

export interface QuestionReviewData {
  qtiXml: string;
  correctAnswer: string | null;
  feedbackGeneral: string | null;
  feedbackPerOption: Record<string, string> | null;
}

export interface ParsedOption {
  letter: string;
  text: string;
  identifier: string;
}

interface QuestionReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  responses: ResponseForReview[];
}

interface ReviewDataMap {
  [key: string]: QuestionReviewData;
}

interface ParsedQuestionCache {
  [key: string]: { html: string; options: ParsedOption[] };
}

// ============================================================================
// QTI PARSING
// ============================================================================

function serializeNodeToHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tagName = el.localName || el.tagName.toLowerCase();

  // Preserve MathML
  if (tagName === "math" || el.namespaceURI === "http://www.w3.org/1998/Math/MathML") {
    return new XMLSerializer().serializeToString(el);
  }

  // Handle images
  if (tagName === "img") {
    const src = el.getAttribute("src") || "";
    const alt = el.getAttribute("alt") || "Imagen";
    return `<img src="${src}" alt="${alt}" class="max-w-full rounded-lg my-2" />`;
  }

  // Tables
  if (tagName === "table") {
    let content = "";
    el.childNodes.forEach((child) => (content += serializeNodeToHtml(child)));
    return `<table class="w-full border-collapse border border-gray-300 my-2 text-sm">${content}</table>`;
  }

  if (["thead", "tbody", "tfoot"].includes(tagName)) {
    let content = "";
    el.childNodes.forEach((child) => (content += serializeNodeToHtml(child)));
    const bgClass = tagName === "thead" ? ' class="bg-gray-100"' : "";
    return `<${tagName}${bgClass}>${content}</${tagName}>`;
  }

  if (tagName === "tr") {
    let content = "";
    el.childNodes.forEach((child) => (content += serializeNodeToHtml(child)));
    return `<tr class="border-b border-gray-200">${content}</tr>`;
  }

  if (tagName === "th" || tagName === "td") {
    const colspan = el.getAttribute("colspan");
    const rowspan = el.getAttribute("rowspan");
    let attrs = `class="border border-gray-300 px-2 py-1 ${tagName === "th" ? "font-semibold text-left" : ""}"`;
    if (colspan) attrs += ` colspan="${colspan}"`;
    if (rowspan) attrs += ` rowspan="${rowspan}"`;
    let content = "";
    el.childNodes.forEach((child) => (content += serializeNodeToHtml(child)));
    return `<${tagName} ${attrs}>${content}</${tagName}>`;
  }

  if (tagName === "p") {
    let content = "";
    el.childNodes.forEach((child) => (content += serializeNodeToHtml(child)));
    return `<p class="mb-3">${content}</p>`;
  }

  // Default: process children
  let content = "";
  el.childNodes.forEach((child) => (content += serializeNodeToHtml(child)));
  return content;
}

function parseQtiXml(xmlString: string): { html: string; options: ParsedOption[] } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const itemBody = xmlDoc.querySelector("itemBody, qti-item-body");
  const prompt = xmlDoc.querySelector("prompt, qti-prompt");
  const choices = xmlDoc.querySelectorAll("simpleChoice, qti-simple-choice");

  let html = "";
  if (itemBody) {
    itemBody.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tagName = el.localName || el.tagName.toLowerCase();
        if (tagName === "qti-choice-interaction" || tagName === "choiceinteraction") return;
      }
      const content = serializeNodeToHtml(child);
      if (content.trim()) html += content;
    });
  }

  if (prompt) {
    html += `<p class="font-semibold mt-2">${serializeNodeToHtml(prompt)}</p>`;
  }

  const letters = ["A", "B", "C", "D"];
  const options: ParsedOption[] = [];

  choices.forEach((choice, index) => {
    const identifier = choice.getAttribute("identifier") || letters[index];
    const text = serializeNodeToHtml(choice).trim() || `Opción ${letters[index]}`;
    options.push({ letter: letters[index], text, identifier });
  });

  return { html, options };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionReviewDrawer({ isOpen, onClose, responses }: QuestionReviewDrawerProps) {
  const [reviewData, setReviewData] = useState<ReviewDataMap>({});
  const [parsedCache, setParsedCache] = useState<ParsedQuestionCache>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stats
  const stats = useMemo(() => {
    const correct = responses.filter((r) => r.isCorrect).length;
    return { correct, total: responses.length };
  }, [responses]);

  // Current response
  const currentResponse = responses[currentIndex];
  const currentKey = currentResponse
    ? `${currentResponse.question.exam.toLowerCase()}-${currentResponse.question.questionNumber}`
    : "";
  const currentReviewData = reviewData[currentKey] || null;
  const currentParsed = parsedCache[currentKey] || { html: "", options: [] };

  // Fetch review data when drawer opens
  const fetchReviewData = useCallback(async () => {
    if (responses.length === 0) return;
    setIsLoading(true);
    try {
      const questionRefs = responses.map((r) => ({
        exam: r.question.exam,
        questionNumber: r.question.questionNumber,
      }));

      const response = await fetch("/api/diagnostic/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionRefs }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setReviewData(data.data);

        const cache: ParsedQuestionCache = {};
        for (const [key, qData] of Object.entries(data.data as ReviewDataMap)) {
          if (qData.qtiXml) cache[key] = parseQtiXml(qData.qtiXml);
        }
        setParsedCache(cache);
      }
    } catch (error) {
      console.error("Failed to fetch review data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [responses]);

  useEffect(() => {
    if (isOpen && Object.keys(reviewData).length === 0) fetchReviewData();
  }, [isOpen, reviewData, fetchReviewData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) setCurrentIndex(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < responses.length - 1) setCurrentIndex(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, currentIndex, responses.length]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-0 z-50 flex flex-col sm:flex-row">
        {/* Navigation Sidebar */}
        <nav className="bg-white border-b sm:border-b-0 sm:border-r border-gray-200 shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-charcoal">Revisión</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 sm:hidden"
                aria-label="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>
            <p className="text-xs text-cool-gray mt-1">{stats.correct}/{stats.total} correctas</p>
          </div>

          {/* Question pills - horizontal on mobile, vertical on desktop */}
          <div className="flex sm:flex-col gap-2 p-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[calc(100vh-140px)]">
            {responses.map((response, idx) => (
              <QuestionPill
                key={idx}
                index={idx}
                isCorrect={response.isCorrect}
                isSkipped={response.selectedAnswer === null}
                isActive={idx === currentIndex}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 bg-off-white overflow-hidden flex flex-col">
          {/* Desktop close button */}
          <div className="hidden sm:flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <LoadingState />
            ) : currentResponse ? (
              <QuestionReviewContent
                index={currentIndex}
                response={currentResponse}
                reviewData={currentReviewData}
                parsedHtml={currentParsed.html}
                parsedOptions={currentParsed.options}
              />
            ) : null}
          </div>

          {/* Navigation Footer */}
          <footer className="bg-white border-t border-gray-200 p-4 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-100 text-charcoal"
            >
              <ArrowIcon direction="left" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <span className="text-sm text-cool-gray">{currentIndex + 1} de {responses.length}</span>

            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === responses.length - 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-100 text-charcoal"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ArrowIcon direction="right" />
            </button>
          </footer>
        </main>
      </div>
    </>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function QuestionPill({
  index,
  isCorrect,
  isSkipped,
  isActive,
  onClick,
}: {
  index: number;
  isCorrect: boolean;
  isSkipped: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const statusColor = isCorrect
    ? "bg-success text-white"
    : isSkipped
      ? "bg-gray-400 text-white"
      : "bg-error text-white";

  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold 
        transition-all shrink-0
        ${isActive ? `${statusColor} ring-2 ring-offset-2 ring-primary scale-110` : statusColor}
        ${!isActive && "opacity-70 hover:opacity-100"}`}
      aria-label={`Pregunta ${index + 1}, ${isCorrect ? "correcta" : isSkipped ? "omitida" : "incorrecta"}`}
      aria-current={isActive ? "true" : undefined}
    >
      {index + 1}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cool-gray">Cargando pregunta...</p>
      </div>
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function CloseIcon() {
  return (
    <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
      />
    </svg>
  );
}
