import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  appendSearchParamsToPath,
  buildSignInUrlWithCallback,
  toUrlSearchParams,
  type QueryParamsRecord,
} from "@/lib/auth/callbackUrl";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getUserAccessStatus } from "@/lib/student/accessControl";
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

  const [journey, accessStatus] = await Promise.all([
    getStudentJourneySnapshot(user.id),
    getUserAccessStatus(user.id, {
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      email: user.email,
    }),
  ]);

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
      title={`Hola, ${displayName}`}
      subtitle="Tu misión semanal y siguiente mejor acción."
    >
      <M1DashboardClient
        contextBanner={contextBanner}
        subscriptionStatus={user.subscriptionStatus}
        masteredAtomCount={accessStatus.masteredAtomCount}
      />
    </PageShell>
  );
}
