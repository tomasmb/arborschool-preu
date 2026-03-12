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
import { StudyClient } from "./study-client";

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
      title="Tu mini-clase"
      subtitle="Aprende con tu mini-clase personalizada. Cada respuesta suma."
    >
      <StudyClient />
    </PageShell>
  );
}
