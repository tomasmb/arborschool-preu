import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { AdminSidebar } from "./AdminSidebar";

export const metadata = {
  title: "Arbor Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user || user.role !== "admin") {
    redirect("/portal");
  }

  return (
    <div className="min-h-screen bg-off-white flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <header
          className="h-14 border-b border-gray-200 bg-white px-6
            flex items-center justify-between"
        >
          <div className="flex items-center gap-3 lg:hidden">
            <Image
              src="/logo-arbor.svg"
              alt="Arbor"
              width={28}
              height={28}
            />
            <span className="font-serif font-bold text-primary text-sm">
              Admin
            </span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {user.firstName ?? user.email}
            </span>
            <Link
              href="/portal"
              className="text-xs text-primary hover:underline"
            >
              Ir al portal
            </Link>
          </div>
        </header>
        <div className="p-6 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
