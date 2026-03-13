import { NextResponse } from "next/server";
import { eq, count, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, schools, accessGrants } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin/apiAuth";

export async function GET() {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const [
    [totalUsersRow],
    [activeUsersRow],
    [freeUsersRow],
    [schoolCountRow],
    [grantCountRow],
    recentUsers,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.subscriptionStatus, "active")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.subscriptionStatus, "free")),
    db.select({ count: count() }).from(schools),
    db.select({ count: count() }).from(accessGrants),
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        subscriptionStatus: users.subscriptionStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(10),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      totalUsers: totalUsersRow?.count ?? 0,
      activeUsers: activeUsersRow?.count ?? 0,
      freeUsers: freeUsersRow?.count ?? 0,
      totalSchools: schoolCountRow?.count ?? 0,
      totalGrants: grantCountRow?.count ?? 0,
      recentUsers,
    },
  });
}
