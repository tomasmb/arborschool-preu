import { NextResponse } from "next/server";

export function forbiddenResponse() {
  return NextResponse.json(
    { success: false, error: "Forbidden" },
    { status: 403 }
  );
}

export function notFoundResponse() {
  return NextResponse.json(
    { success: false, error: "User not found" },
    { status: 404 }
  );
}

export function missingRouteResponse() {
  return NextResponse.json(
    { success: false, error: "diagnosticData.results.route is required" },
    { status: 400 }
  );
}
