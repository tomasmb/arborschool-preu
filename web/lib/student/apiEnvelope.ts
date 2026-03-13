import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

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
  | "SESSION_CREATE_FAILED"
  | "SESSION_FETCH_FAILED"
  | "ANSWER_SUBMIT_FAILED"
  | "LESSON_VIEW_FAILED"
  | "NEXT_QUESTION_FAILED"
  | "REMINDER_PREFERENCES_SAVE_FAILED"
  | "REMINDER_PREFERENCES_LOAD_FAILED"
  | "REVIEW_SESSION_FAILED"
  | "REVIEW_ANSWER_FAILED"
  | "REVIEW_COMPLETE_FAILED"
  | "SCAN_NEXT_FAILED"
  | "SCAN_ANSWER_FAILED"
  | "GOALS_LOAD_FAILED"
  | "PROFILE_LOAD_FAILED"
  | "INVALID_ID"
  | "INVALID_PARAMS"
  | "GOAL_NOT_FOUND"
  | "SIMULATION_LOAD_FAILED"
  | "VERIFICATION_SESSION_FAILED"
  | "VERIFICATION_ANSWER_FAILED"
  | "ACCESS_REQUIRED"
  | "VERIFICATION_REQUIRED"
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
