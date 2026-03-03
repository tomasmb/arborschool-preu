import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { M1DashboardClient } from "./M1DashboardClient";

export default async function PortalPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/portal");
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    redirect("/auth/signin?callbackUrl=/portal");
  }

  const displayName = user.firstName ?? session.user.name ?? "Estudiante";

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Portal estudiante</p>
            <h1 className="text-3xl font-serif font-bold text-primary">
              Hola, {displayName}
            </h1>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <M1DashboardClient />
      </div>
    </main>
  );
}
