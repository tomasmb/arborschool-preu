/**
 * QTI (Question and Test Interoperability) XML Parser
 *
 * Parses QTI XML format used for standardized test questions.
 * Preserves MathML, tables, and other rich content.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedQuestion {
  html: string;
  options: Array<{ letter: string; text: string; identifier: string }>;
  correctAnswer: string | null;
  atoms: QuestionAtom[];
}

export interface QuestionAtom {
  atomId: string;
  relevance: "primary" | "secondary";
}

// ============================================================================
// DOM SERIALIZATION
// ============================================================================

/**
 * Serialize a DOM node to HTML string, preserving MathML and tables.
 * Applies consistent Tailwind styling to elements.
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
      const content = serializeChildNodes(el);
      return `<table class="w-full border-collapse border border-gray-300 my-4 text-sm">${content}</table>`;
    }

    // Preserve table section elements
    if (["thead", "tbody", "tfoot"].includes(tagName)) {
      const content = serializeChildNodes(el);
      const bgClass = tagName === "thead" ? ' class="bg-gray-100"' : "";
      return `<${tagName}${bgClass}>${content}</${tagName}>`;
    }

    if (tagName === "tr") {
      const content = serializeChildNodes(el);
      return `<tr class="border-b border-gray-200">${content}</tr>`;
    }

    if (tagName === "th" || tagName === "td") {
      const colspan = el.getAttribute("colspan");
      const rowspan = el.getAttribute("rowspan");
      let attrs = `class="border border-gray-300 px-3 py-2 ${tagName === "th" ? "font-semibold text-left" : ""}"`;
      if (colspan) attrs += ` colspan="${colspan}"`;
      if (rowspan) attrs += ` rowspan="${rowspan}"`;
      const content = serializeChildNodes(el);
      return `<${tagName} ${attrs}>${content}</${tagName}>`;
    }

    // Handle div containers
    if (tagName === "div") {
      const content = serializeChildNodes(el);
      return `<div class="my-4">${content}</div>`;
    }

    // Preserve paragraph structure
    if (tagName === "p") {
      const content = serializeChildNodes(el);
      return `<p class="mb-4">${content}</p>`;
    }

    // Recursively process children for other elements
    return serializeChildNodes(el);
  }

  return "";
}

/**
 * Helper to serialize all child nodes of an element
 */
function serializeChildNodes(el: Element): string {
  let content = "";
  el.childNodes.forEach((child) => {
    content += serializeNodeToHtml(child);
  });
  return content;
}

// ============================================================================
// QTI PARSING
// ============================================================================

/**
 * Parse QTI XML to extract question content and options.
 *
 * Supports both QTI 2.x and QTI 3.x element naming conventions.
 *
 * @param xmlString - Raw QTI XML string
 * @returns Parsed question with HTML content, options, and correct answer
 */
export function parseQtiXml(xmlString: string): ParsedQuestion {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Extract question content (supports both QTI 2.x and 3.x)
  const itemBody = xmlDoc.querySelector("itemBody, qti-item-body");
  const prompt = xmlDoc.querySelector("prompt, qti-prompt");
  const choices = xmlDoc.querySelectorAll("simpleChoice, qti-simple-choice");
  const correctResponse = xmlDoc.querySelector(
    "correctResponse value, qti-correct-response qti-value"
  );

  // Build question HTML preserving MathML, tables, and other content
  let html = "";
  if (itemBody) {
    html = processItemBody(itemBody);
  }

  if (prompt) {
    const content = serializeNodeToHtml(prompt);
    html += `<p class="font-semibold mt-4">${content}</p>`;
  }

  // Parse answer options
  const options = parseChoices(choices);

  // Map correct answer identifier to letter
  const correctAnswer = findCorrectAnswer(correctResponse, options);

  return { html, options, correctAnswer, atoms: [] };
}

/**
 * Process the item body, excluding choice interaction elements
 */
function processItemBody(itemBody: Element): string {
  let html = "";

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

  return html;
}

/**
 * Parse choice elements into structured options
 */
function parseChoices(choices: NodeListOf<Element>): ParsedQuestion["options"] {
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

  return options;
}

/**
 * Find the correct answer letter from the correct response element
 */
function findCorrectAnswer(
  correctResponse: Element | null,
  options: ParsedQuestion["options"]
): string | null {
  const correctAnswerIdentifier = correctResponse?.textContent || null;

  if (correctAnswerIdentifier) {
    const correctOption = options.find(
      (o) => o.identifier === correctAnswerIdentifier
    );
    if (correctOption) {
      return correctOption.letter;
    }
  }

  return null;
}
