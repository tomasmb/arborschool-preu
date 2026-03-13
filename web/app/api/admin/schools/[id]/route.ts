import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin/apiAuth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const { id } = await params;

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, id))
    .limit(1);

  if (!school) {
    return NextResponse.json(
      { success: false, error: "School not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: school });
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const { id } = await params;

  let body: { name?: string; contactEmail?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(schools)
    .set({
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.contactEmail !== undefined
        ? { contactEmail: body.contactEmail?.trim() || null }
        : {}),
      ...(body.notes !== undefined
        ? { notes: body.notes?.trim() || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(schools.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { success: false, error: "School not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const { id } = await params;

  const [deleted] = await db
    .delete(schools)
    .where(eq(schools.id, id))
    .returning({ id: schools.id });

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "School not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
