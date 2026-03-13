import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin/apiAuth";

export async function GET() {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const rows = await db
    .select()
    .from(schools)
    .orderBy(schools.createdAt);

  return NextResponse.json({ success: true, data: rows });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  let body: { name?: string; contactEmail?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (!body.name?.trim()) {
    return NextResponse.json(
      { success: false, error: "name is required" },
      { status: 400 }
    );
  }

  const slug = slugify(body.name);
  const existing = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { success: false, error: "A school with this name already exists" },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(schools)
    .values({
      name: body.name.trim(),
      slug,
      contactEmail: body.contactEmail?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
