export type {
  ApiEnvelope,
  ApiErrorPayload,
} from "@/lib/student/apiClientEnvelope";
export { resolveApiErrorMessage } from "@/lib/student/apiClientEnvelope";
import type {
  StudySprintAnswerPayload,
  StudySprintCompletionPayload,
  StudySprintCreatePayload,
  StudySprintItemPayload,
  StudySprintPayload,
} from "@/lib/student/studySprint.types";

export type SprintCreateData = StudySprintCreatePayload;
export type SprintItem = StudySprintItemPayload;
export type SprintData = StudySprintPayload;
export type AnswerResponse = StudySprintAnswerPayload;
export type CompletionResponse = StudySprintCompletionPayload;

export function sanitizeSprintId(value: string): string | null {
  if (!value) {
    return null;
  }

  return /^[a-f0-9-]{36}$/i.test(value) ? value : null;
}
