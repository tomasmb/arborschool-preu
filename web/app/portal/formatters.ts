import type { ApiEnvelope } from "./types";

export function formatScore(value: number | null): string {
  if (value === null) {
    return "-";
  }
  return value.toLocaleString("es-CL");
}

export function formatMinutes(value: number | null): string {
  if (value === null) {
    return "-";
  }
  if (value === 0) {
    return "0 min";
  }
  if (value < 60) {
    return `${value.toLocaleString("es-CL")} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (minutes === 0) {
    return `${hours.toLocaleString("es-CL")} h`;
  }

  return `${hours.toLocaleString("es-CL")} h ${minutes.toLocaleString("es-CL")} min`;
}

export function getErrorMessage(
  payload: ApiEnvelope<unknown>,
  fallback: string
) {
  if (payload.success) {
    return fallback;
  }
  if (typeof payload.error === "string") {
    return payload.error;
  }
  return payload.error.message;
}
