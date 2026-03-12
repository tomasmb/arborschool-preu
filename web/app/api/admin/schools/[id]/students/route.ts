import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin/apiAuth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const { id } = await params;

  const students = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      subscriptionStatus: users.subscriptionStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.schoolId, id))
    .orderBy(users.createdAt);

  return NextResponse.json({ success: true, data: students });
}
