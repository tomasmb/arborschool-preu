/**
 * Client-side QTI XML Parser for Review
 *
 * Parses QTI XML in the browser for displaying questions during review.
 * Extracts question content, options, and feedback for post-test review.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedOption {
  letter: string;
  text: string;
  identifier: string;
  feedback?: string;
}

export interface ParsedQtiQuestion {
  html: string;
  options: ParsedOption[];
  generalFeedback?: string;
}

// ============================================================================
// FEEDBACK ELEMENT DETECTION
// ============================================================================

// Inline feedback elements to filter from choices
const INLINE_FEEDBACK_ELEMENTS = new Set([
  "qti-feedback-inline",
  "feedbackinline",
]);

// General feedback block elements
const FEEDBACK_BLOCK_ELEMENTS = new Set([
  "qti-feedback-block",
  "feedbackblock",
  "qti-modal-feedback",
  "modalfeedback",
]);

function isInlineFeedbackElement(tagName: string): boolean {
  return INLINE_FEEDBACK_ELEMENTS.has(tagName.toLowerCase());
}

function isFeedbackBlockElement(tagName: string): boolean {
  return FEEDBACK_BLOCK_ELEMENTS.has(tagName.toLowerCase());
}

// ============================================================================
// DOM SERIALIZATION
// ============================================================================

function serializeNodeToHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tagName = el.localName || el.tagName.toLowerCase();

  // Preserve MathML
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

/**
 * Serialize choice content excluding inline feedback elements.
 * Feedback should not appear as part of the option text.
 */
function serializeChoiceContent(choice: Element): string {
  let content = "";
  choice.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = (el.localName || el.tagName).toLowerCase();
      // Skip inline feedback - shown separately, not mixed with option text
      if (isInlineFeedbackElement(tagName)) return;
    }
    content += serializeNodeToHtml(child);
  });
  return content;
}

/**
 * Extract inline feedback content from a choice element.
 */
function extractChoiceFeedback(choice: Element): string | undefined {
  const feedbackEl = choice.querySelector(
    "qti-feedback-inline, feedbackInline"
  );
  if (!feedbackEl) return undefined;
  return serializeNodeToHtml(feedbackEl).trim() || undefined;
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse QTI XML for review display.
 * Extracts question content, options with feedback, and general solution.
 */
export function parseQtiXmlForReview(xmlString: string): ParsedQtiQuestion {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const itemBody = xmlDoc.querySelector("itemBody, qti-item-body");
  const prompt = xmlDoc.querySelector("prompt, qti-prompt");
  const choices = xmlDoc.querySelectorAll("simpleChoice, qti-simple-choice");

  let html = "";
  let generalFeedback: string | undefined;

  if (itemBody) {
    itemBody.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tagName = (el.localName || el.tagName).toLowerCase();
        // Skip choice interaction - handled separately
        if (
          tagName === "qti-choice-interaction" ||
          tagName === "choiceinteraction"
        ) {
          return;
        }
        // Extract general feedback block separately
        if (isFeedbackBlockElement(tagName)) {
          const feedbackContent = serializeNodeToHtml(el).trim();
          if (feedbackContent) {
            generalFeedback = feedbackContent;
          }
          return;
        }
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
    // Use serializeChoiceContent to exclude inline feedback from option text
    const text =
      serializeChoiceContent(choice).trim() || `Opción ${letters[index]}`;
    // Extract per-option feedback
    const feedback = extractChoiceFeedback(choice);
    options.push({ letter: letters[index], text, identifier, feedback });
  });

  return { html, options, generalFeedback };
}
