export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const TECHNICAL_ERROR_PATTERN =
  /\b(error|exception|stack|trace|timeout|fetch|network|json|sql|postgres|drizzle|invalid|undefined|null|unauthorized|forbidden|internal|failed)\b/i;

export function toStudentSafeMessage(
  message: string | null | undefined,
  fallback: string
): string {
  const trimmed = message?.trim() ?? "";
  if (!trimmed) {
    return fallback;
  }

  if (
    trimmed.length > 160 ||
    TECHNICAL_ERROR_PATTERN.test(trimmed) ||
    /[{}[\]<>`]/.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}
