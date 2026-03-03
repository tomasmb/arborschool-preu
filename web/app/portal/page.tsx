import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";

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

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-serif font-semibold text-primary mb-2">
            Hub M1 (Fase 1)
          </h2>
          <p className="text-gray-700 mb-4">
            La base de autenticación ya está habilitada. En la próxima fase,
            aquí mostraremos objetivos y simulación de admisión.
          </p>
          <Link
            href="/portal/goals"
            className={[
              "inline-flex items-center rounded-lg bg-primary text-white px-4 py-2",
              "text-sm font-semibold hover:bg-primary/90 transition-colors",
            ].join(" ")}
          >
            Ir a objetivos
          </Link>
        </section>
      </div>
    </main>
  );
}
