export type ApiErrorPayload =
  | string
  | {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiErrorPayload;
    };

export function resolveApiErrorMessage(
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
