import { NextResponse } from "next/server";

/**
 * Deprecated route.
 * Diagnostic now requires authenticated students and no pre-auth mini-form.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Deprecated endpoint: use authenticated portal flow at /auth/signin and /diagnostico.",
    },
    { status: 410 }
  );
}
