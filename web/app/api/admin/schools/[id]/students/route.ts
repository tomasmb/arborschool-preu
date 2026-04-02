import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin/apiAuth";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (value === null || value === "") {
    return fallback;
  }
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    parsePositiveInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE),
  );

  const [countRow] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.schoolId, id));

  const total = Number(countRow?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage =
    totalPages === 0 ? 1 : Math.min(page, Math.max(1, totalPages));
  const safeOffset =
    totalPages === 0 ? 0 : (safePage - 1) * pageSize;

  const items = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      curso: users.curso,
      subscriptionStatus: users.subscriptionStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.schoolId, id))
    .orderBy(users.createdAt)
    .limit(pageSize)
    .offset(safeOffset);

  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page: safePage,
      pageSize,
      totalPages,
    },
  });
}
