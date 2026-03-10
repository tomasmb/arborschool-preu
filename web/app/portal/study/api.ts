import type {
  AnswerResponse,
  ApiEnvelope,
  CompletionResponse,
  SprintCreateData,
  SprintData,
} from "./types";
import { resolveApiErrorMessage } from "./types";

export async function createStudySprint(itemCount = 5) {
  const response = await fetch("/api/student/study-sprints", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemCount }),
  });

  const payload = (await response.json()) as ApiEnvelope<SprintCreateData>;
  if (!response.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "No pudimos crear la mini-clase")
    );
  }

  return payload.data;
}

export async function fetchStudySprint(sprintId: string) {
  const response = await fetch(`/api/student/study-sprints/${sprintId}`, {
    method: "GET",
    credentials: "include",
  });

  const payload = (await response.json()) as ApiEnvelope<SprintData>;
  if (!response.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "No pudimos cargar la mini-clase")
    );
  }

  return payload.data;
}

export async function submitStudySprintAnswer(params: {
  sprintId: string;
  sprintItemId: string;
  selectedAnswer: string;
}) {
  const response = await fetch(
    `/api/student/study-sprints/${params.sprintId}/answer`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sprintItemId: params.sprintItemId,
        selectedAnswer: params.selectedAnswer,
      }),
    }
  );

  const payload = (await response.json()) as ApiEnvelope<AnswerResponse>;
  if (!response.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "No pudimos guardar tu respuesta")
    );
  }

  return payload.data;
}

export async function completeStudySprint(sprintId: string) {
  const response = await fetch(
    `/api/student/study-sprints/${sprintId}/complete`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const payload = (await response.json()) as ApiEnvelope<CompletionResponse>;
  if (!response.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "No pudimos completar la mini-clase")
    );
  }

  return payload.data;
}
