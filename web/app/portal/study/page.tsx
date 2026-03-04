import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { PageShell } from "../components";
import { StudySprintClient } from "./study-sprint-client";

export default async function StudyPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/portal/study");
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    redirect("/auth/signin?callbackUrl=/portal/study");
  }

  return (
    <PageShell
      eyebrow="Portal estudiante"
      title="Sprint de hoy"
      subtitle="Resuelve tu sprint personalizado. Cada respuesta actualiza tu misión semanal."
      actions={
        <Link
          href="/portal"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Volver al portal
        </Link>
      }
    >
      <StudySprintClient />
    </PageShell>
  );
}
