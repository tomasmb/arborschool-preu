import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { accessGrants, schools } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin/apiAuth";

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const schoolId = request.nextUrl.searchParams.get("schoolId");

  let query = db
    .select({
      id: accessGrants.id,
      type: accessGrants.type,
      value: accessGrants.value,
      schoolId: accessGrants.schoolId,
      schoolName: schools.name,
      createdAt: accessGrants.createdAt,
    })
    .from(accessGrants)
    .leftJoin(schools, eq(accessGrants.schoolId, schools.id))
    .orderBy(accessGrants.createdAt)
    .$dynamic();

  if (schoolId) {
    query = query.where(eq(accessGrants.schoolId, schoolId));
  }

  const rows = await query;
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  let body: {
    type?: "email" | "domain";
    value?: string;
    schoolId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (!body.type || !body.value?.trim()) {
    return NextResponse.json(
      { success: false, error: "type and value are required" },
      { status: 400 }
    );
  }

  const normalizedValue = body.value.trim().toLowerCase();

  if (body.type === "email" && !normalizedValue.includes("@")) {
    return NextResponse.json(
      { success: false, error: "Invalid email format" },
      { status: 400 }
    );
  }

  if (body.type === "domain" && !normalizedValue.startsWith("@")) {
    return NextResponse.json(
      { success: false, error: "Domain must start with @" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = await db
    .select({ id: accessGrants.id })
    .from(accessGrants)
    .where(
      and(
        eq(accessGrants.type, body.type),
        eq(accessGrants.value, normalizedValue)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { success: false, error: "This access grant already exists" },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(accessGrants)
    .values({
      type: body.type,
      value: normalizedValue,
      schoolId: body.schoolId || null,
      grantedBy: auth.userId,
    })
    .returning();

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const grantId = request.nextUrl.searchParams.get("id");
  if (!grantId) {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400 }
    );
  }

  const [deleted] = await db
    .delete(accessGrants)
    .where(eq(accessGrants.id, grantId))
    .returning({ id: accessGrants.id });

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Grant not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
