import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import { resolvePostLoginRedirect } from "@/lib/auth/postLoginRedirect";

export default async function PostLoginPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    redirect("/auth/signin");
  }

  const journeySnapshot = await getStudentJourneySnapshot(user.id);
  const destination = resolvePostLoginRedirect({
    journeyState: journeySnapshot.journeyState,
  });

  console.info("student_journey_routed", {
    userId: user.id,
    journeyState: journeySnapshot.journeyState,
    destination,
    at: new Date().toISOString(),
  });

  redirect(destination);
}
