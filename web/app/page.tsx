import { auth } from "@/auth";
import { getAuthenticatedUserById } from "@/lib/auth/users";
import { getStudentJourneySnapshot } from "@/lib/student/journeyState";
import { resolveLandingPrimaryAction } from "@/lib/student/journeyRouting";
import { LandingPageClient } from "./LandingPageClient";

async function resolveLandingPrimaryActionForPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return resolveLandingPrimaryAction({
      isAuthenticated: false,
      hasUserRecord: false,
    });
  }

  const user = await getAuthenticatedUserById(userId);
  if (!user) {
    return resolveLandingPrimaryAction({
      isAuthenticated: true,
      hasUserRecord: false,
    });
  }

  const journey = await getStudentJourneySnapshot(user.id);
  return resolveLandingPrimaryAction({
    isAuthenticated: true,
    hasUserRecord: true,
    journeySnapshot: journey,
  });
}

export default async function HomePage() {
  const primaryAction = await resolveLandingPrimaryActionForPage();
  return <LandingPageClient primaryAction={primaryAction} />;
}
