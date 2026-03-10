import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  appendSearchParamsToPath,
  buildSignInUrlWithCallback,
  type QueryParamsRecord,
} from "@/lib/auth/callbackUrl";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import { resolveDiagnosticEntryRoute } from "@/lib/student/journeyRouting";
import DiagnosticoClientPage from "./DiagnosticoClientPage";

interface DiagnosticoPageProps {
  searchParams?: Promise<QueryParamsRecord>;
}

export default async function DiagnosticoPage({
  searchParams,
}: DiagnosticoPageProps) {
  const queryParams = await searchParams;
  const callbackPath = appendSearchParamsToPath("/diagnostico", queryParams);
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
  const destination = resolveDiagnosticEntryRoute(journey);
  if (destination !== "/diagnostico") {
    redirect(destination);
  }

  return <DiagnosticoClientPage />;
}
