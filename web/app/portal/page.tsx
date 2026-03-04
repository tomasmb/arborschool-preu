import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import {
  appendSearchParamsToPath,
  buildSignInUrlWithCallback,
  toUrlSearchParams,
  type QueryParamsRecord,
} from "@/lib/auth/callbackUrl";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import {
  PORTAL_CONTEXT_BANNER_PARAM,
  resolvePortalContextBanner,
} from "@/lib/student/journeyRouting";
import { PageShell } from "./components";
import { M1DashboardClient } from "./M1DashboardClient";

interface PortalPageProps {
  searchParams?: Promise<QueryParamsRecord>;
}

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const queryParams = await searchParams;
  const callbackPath = appendSearchParamsToPath("/portal", queryParams);
  const signInUrl = buildSignInUrlWithCallback(callbackPath);

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(signInUrl);
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    redirect(signInUrl);
  }

  const journey = await getStudentJourneySnapshot(user.id);
  if (journey.journeyState === "planning_required") {
    redirect("/portal/goals?mode=planning");
  }

  if (journey.journeyState === "diagnostic_in_progress") {
    redirect("/diagnostico");
  }

  const displayName = user.firstName ?? session.user.name ?? "Estudiante";
  const bannerCode = toUrlSearchParams(queryParams).get(
    PORTAL_CONTEXT_BANNER_PARAM
  );
  const contextBanner = resolvePortalContextBanner(bannerCode);

  return (
    <PageShell
      eyebrow="Portal estudiante"
      title={`Hola, ${displayName}`}
      subtitle="Revisa tu misión semanal y ejecuta la siguiente mejor acción para mover tu puntaje."
      actions={
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </form>
      }
    >
      <M1DashboardClient contextBanner={contextBanner} />
    </PageShell>
  );
}
