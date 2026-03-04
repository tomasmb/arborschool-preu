import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import {
  AUTH_DIAGNOSTIC_CALLBACK_URL,
  resolveDiagnosticEntryRoute,
} from "@/lib/student/journeyRouting";
import DiagnosticoClientPage from "./DiagnosticoClientPage";

export default async function DiagnosticoPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(AUTH_DIAGNOSTIC_CALLBACK_URL);
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    redirect(AUTH_DIAGNOSTIC_CALLBACK_URL);
  }

  const journey = await getStudentJourneySnapshot(user.id);
  const destination = resolveDiagnosticEntryRoute(journey);
  if (destination !== "/diagnostico") {
    redirect(destination);
  }

  return <DiagnosticoClientPage />;
}
