import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  appendSearchParamsToPath,
  buildSignInUrlWithCallback,
  toUrlSearchParams,
  type QueryParamsRecord,
} from "@/lib/auth/callbackUrl";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import {
  EMAIL_LINK_INTENT_PARAM,
  EMAIL_LINK_SOURCE_PARAM,
  EMAIL_LINK_SOURCE_VALUE,
  PORTAL_CONTEXT_BANNER_PARAM,
  resolveStudyEntryRoute,
} from "@/lib/student/journeyRouting";
import { PageShell } from "../components";
import { StudySprintClient } from "./study-sprint-client";

interface StudyPageProps {
  searchParams?: Promise<QueryParamsRecord>;
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
  const queryParams = await searchParams;
  const callbackPath = appendSearchParamsToPath("/portal/study", queryParams);
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
  const deepLinkParams = toUrlSearchParams(queryParams);
  const studyEntry = resolveStudyEntryRoute({
    journeySnapshot: journey,
    isEmailLink:
      deepLinkParams.get(EMAIL_LINK_SOURCE_PARAM) === EMAIL_LINK_SOURCE_VALUE,
    emailIntent: deepLinkParams.get(EMAIL_LINK_INTENT_PARAM),
  });

  if (studyEntry.route !== "/portal/study") {
    if (studyEntry.contextBannerCode) {
      const bannerParams = new URLSearchParams({
        [PORTAL_CONTEXT_BANNER_PARAM]: studyEntry.contextBannerCode,
      });
      redirect(`/portal?${bannerParams.toString()}`);
    }

    redirect(studyEntry.route);
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
