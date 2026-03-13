/**
 * Shared helpers for question resolution across full test modules.
 */

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { studentResponses } from "@/db/schema";

/**
 * Strips "Choice" prefix from QTI answer identifiers.
 * e.g. "ChoiceA" → "A", "A" → "A"
 */
export function normalizeCorrectAnswer(answer: string): string {
  return answer.startsWith("Choice")
    ? answer.replace("Choice", "")
    : answer;
}

/**
 * Returns IDs of all questions a student has answered across every test
 * attempt (diagnostic + full tests). Used to prefer unseen questions.
 *
 * @param excludeAttemptId - omit responses from this attempt (resume
 *   scenario: mid-test answers should not affect question resolution)
 */
export async function getSeenQuestionIds(
  userId: string,
  excludeAttemptId?: string
): Promise<Set<string>> {
  const conds = [eq(studentResponses.userId, userId)];
  if (excludeAttemptId) {
    conds.push(ne(studentResponses.testAttemptId, excludeAttemptId));
  }
  const rows = await db
    .select({ questionId: studentResponses.questionId })
    .from(studentResponses)
    .where(and(...conds));
  return new Set(
    rows.filter((r) => r.questionId != null).map((r) => r.questionId!)
  );
}
