import { NextResponse } from "next/server";

export type StudentApiErrorCode =
  | "UNAUTHORIZED"
  | "USER_NOT_FOUND"
  | "INVALID_BODY"
  | "MISSING_FIELDS"
  | "NOT_FOUND"
  | "GOALS_REQUIRED"
  | "GOALS_LIMIT_EXCEEDED"
  | "GOALS_SAVE_FAILED"
  | "DASHBOARD_LOAD_FAILED"
  | "NEXT_ACTION_LOAD_FAILED"
  | "MISSION_LOAD_FAILED"
  | "SPRINT_CREATE_FAILED"
  | "SPRINT_FETCH_FAILED"
  | "SPRINT_ANSWER_FAILED"
  | "SPRINT_COMPLETE_FAILED"
  | "REMINDER_PREFERENCES_SAVE_FAILED"
  | "UNKNOWN";

type ErrorDetails = Record<string, unknown> | undefined;

export type StudentApiError = {
  code: StudentApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type StudentApiSuccess<T> = {
  success: true;
  data: T;
};

export type StudentApiFailure = {
  success: false;
  error: StudentApiError;
};

export type StudentApiResponse<T> = StudentApiSuccess<T> | StudentApiFailure;

export function studentApiSuccess<T>(data: T) {
  return NextResponse.json<StudentApiSuccess<T>>({
    success: true,
    data,
  });
}

export function studentApiError(
  code: StudentApiErrorCode,
  message: string,
  status: number,
  details?: ErrorDetails
) {
  return NextResponse.json<StudentApiFailure>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}
