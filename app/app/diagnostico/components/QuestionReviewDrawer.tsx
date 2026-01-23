"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { type MSTQuestion } from "@/lib/diagnostic/config";
import {
  QuestionReviewItem,
  type ParsedOption,
  type QuestionReviewData,
} from "./QuestionReviewItem";

// ============================================================================
// TYPES
// ============================================================================

export interface ResponseForReview {
  question: MSTQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
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
  [key: string]: {
    html: string;
    options: ParsedOption[];
  };
}

// ============================================================================
// ICONS
// ============================================================================

function CloseIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ============================================================================
// QTI PARSING (reuse from QuestionScreen)
// ============================================================================

function serializeNodeToHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
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
      return `<table class="w-full border-collapse border border-gray-300 my-2 text-xs">${content}</table>`;
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
      return `<p class="mb-2">${content}</p>`;
    }

    // Default: process children
    let content = "";
    el.childNodes.forEach((child) => (content += serializeNodeToHtml(child)));
    return content;
  }

  return "";
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
        if (tagName === "qti-choice-interaction" || tagName === "choiceinteraction") {
          return;
        }
      }
      const content = serializeNodeToHtml(child);
      if (content.trim()) {
        html += content;
      }
    });
  }

  if (prompt) {
    const content = serializeNodeToHtml(prompt);
    html += `<p class="font-semibold mt-2">${content}</p>`;
  }

  const letters = ["A", "B", "C", "D"];
  const options: ParsedOption[] = [];

  choices.forEach((choice, index) => {
    const identifier = choice.getAttribute("identifier") || letters[index];
    const text = serializeNodeToHtml(choice).trim() || `Opcion ${letters[index]}`;
    options.push({ letter: letters[index], text, identifier });
  });

  return { html, options };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionReviewDrawer({
  isOpen,
  onClose,
  responses,
}: QuestionReviewDrawerProps) {
  const [reviewData, setReviewData] = useState<ReviewDataMap>({});
  const [parsedCache, setParsedCache] = useState<ParsedQuestionCache>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "correct" | "incorrect">("all");

  // Calculate stats
  const stats = useMemo(() => {
    const correct = responses.filter((r) => r.isCorrect).length;
    const incorrect = responses.filter((r) => !r.isCorrect && r.selectedAnswer !== null).length;
    const skipped = responses.filter((r) => r.selectedAnswer === null).length;
    return { correct, incorrect, skipped, total: responses.length };
  }, [responses]);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    if (activeFilter === "all") return responses;
    if (activeFilter === "correct") return responses.filter((r) => r.isCorrect);
    return responses.filter((r) => !r.isCorrect);
  }, [responses, activeFilter]);

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

        // Parse QTI XML for each question
        const cache: ParsedQuestionCache = {};
        for (const [key, qData] of Object.entries(data.data as ReviewDataMap)) {
          if (qData.qtiXml) {
            cache[key] = parseQtiXml(qData.qtiXml);
          }
        }
        setParsedCache(cache);
      }
    } catch (error) {
      console.error("Failed to fetch review data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [responses]);

  // Fetch data when drawer opens
  useEffect(() => {
    if (isOpen && Object.keys(reviewData).length === 0) {
      fetchReviewData();
    }
  }, [isOpen, reviewData, fetchReviewData]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
            <div>
              <h2 className="text-xl font-serif font-bold text-charcoal">
                Revision de Respuestas
              </h2>
              <p className="text-sm text-cool-gray mt-0.5">
                {stats.correct} correctas, {stats.incorrect} incorrectas
                {stats.skipped > 0 && `, ${stats.skipped} omitidas`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center 
                hover:bg-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <CloseIcon className="w-5 h-5 text-charcoal" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 p-4 border-b border-gray-100 shrink-0">
            <FilterButton
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
              label="Todas"
              count={stats.total}
            />
            <FilterButton
              active={activeFilter === "correct"}
              onClick={() => setActiveFilter("correct")}
              label="Correctas"
              count={stats.correct}
              variant="success"
            />
            <FilterButton
              active={activeFilter === "incorrect"}
              onClick={() => setActiveFilter("incorrect")}
              label="Incorrectas"
              count={stats.incorrect + stats.skipped}
              variant="error"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-cool-gray text-sm">Cargando preguntas...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredResponses.map((response, idx) => {
                  const key = `${response.question.exam.toLowerCase()}-${response.question.questionNumber}`;
                  const qData = reviewData[key] || null;
                  const parsed = parsedCache[key] || { html: "", options: [] };

                  // Find original index for question number
                  const originalIndex = responses.indexOf(response);

                  return (
                    <QuestionReviewItem
                      key={key}
                      index={originalIndex}
                      question={response.question}
                      selectedAnswer={response.selectedAnswer}
                      isCorrect={response.isCorrect}
                      reviewData={qData}
                      parsedOptions={parsed.options}
                      questionHtml={parsed.html}
                    />
                  );
                })}

                {filteredResponses.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-cool-gray">
                      No hay preguntas en esta categoria.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <button
              onClick={onClose}
              className="w-full btn-primary py-3"
            >
              Cerrar Revision
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}

// ============================================================================
// FILTER BUTTON
// ============================================================================

function FilterButton({
  active,
  onClick,
  label,
  count,
  variant = "default",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  variant?: "default" | "success" | "error";
}) {
  const baseClasses = "px-4 py-2 rounded-full text-sm font-medium transition-all";

  const variantClasses = {
    default: active
      ? "bg-primary text-white"
      : "bg-gray-100 text-charcoal hover:bg-gray-200",
    success: active
      ? "bg-success text-white"
      : "bg-success/10 text-success hover:bg-success/20",
    error: active
      ? "bg-error text-white"
      : "bg-error/10 text-error hover:bg-error/20",
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]}`}>
      {label}{" "}
      <span className={`ml-1 ${active ? "opacity-80" : "opacity-60"}`}>({count})</span>
    </button>
  );
}
