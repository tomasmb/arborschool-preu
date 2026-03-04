import {
  appendSearchParamsToPath,
  buildSignInUrlWithCallback,
} from "@/lib/auth/callbackUrl";
import {
  EMAIL_LINK_INTENT_START_FIRST_SPRINT,
  resolvePortalContextBanner,
  resolveStudyEntryRoute,
  STALE_EMAIL_FIRST_SPRINT_BANNER,
} from "@/lib/student/journeyRouting";
import type { StudentJourneySnapshot } from "@/lib/student/journeyState";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertCallbackPreservesQuery() {
  const callbackPath = appendSearchParamsToPath("/diagnostico", {
    source: "email",
    intent: EMAIL_LINK_INTENT_START_FIRST_SPRINT,
  });

  const signInUrl = buildSignInUrlWithCallback(callbackPath);
  const parsed = new URL(signInUrl, "https://preu.arbor.school");
  const callbackUrl = parsed.searchParams.get("callbackUrl");

  assert(parsed.pathname === "/auth/signin", "Unexpected auth sign-in route");
  assert(
    callbackUrl === "/diagnostico?source=email&intent=start_first_sprint",
    "Callback URL should preserve full deep-link query"
  );

  const loopGuard = buildSignInUrlWithCallback(
    "/auth/signin?callbackUrl=/portal"
  );
  const guardedCallback = new URL(
    loopGuard,
    "https://preu.arbor.school"
  ).searchParams.get("callbackUrl");
  assert(
    guardedCallback === "/auth/post-login",
    "Sign-in callback should guard against sign-in redirect loops"
  );
}

function journeySnapshot(
  journeyState: StudentJourneySnapshot["journeyState"],
  hasPlanningProfile: boolean
): Pick<StudentJourneySnapshot, "journeyState" | "hasPlanningProfile"> {
  return {
    journeyState,
    hasPlanningProfile,
  };
}

function assertStudyEntryRoutingMatrix() {
  const noPlanning = resolveStudyEntryRoute({
    journeySnapshot: journeySnapshot("planning_required", false),
    isEmailLink: false,
  });
  assert(
    noPlanning.route === "/portal/goals?mode=planning",
    "Planning missing users must return to planning mode"
  );

  const planningDone = resolveStudyEntryRoute({
    journeySnapshot: journeySnapshot("planning_required", true),
    isEmailLink: false,
  });
  assert(
    planningDone.route === "/diagnostico",
    "Planning-complete users without diagnostic must continue to diagnostic"
  );

  const diagnosticInProgress = resolveStudyEntryRoute({
    journeySnapshot: journeySnapshot("diagnostic_in_progress", true),
    isEmailLink: false,
  });
  assert(
    diagnosticInProgress.route === "/diagnostico",
    "In-progress diagnostic users must resume diagnostic"
  );

  const activationReady = resolveStudyEntryRoute({
    journeySnapshot: journeySnapshot("activation_ready", true),
    isEmailLink: true,
    emailIntent: EMAIL_LINK_INTENT_START_FIRST_SPRINT,
  });
  assert(
    activationReady.route === "/portal/study",
    "Activation-ready users should keep sprint deep links"
  );

  const staleEmail = resolveStudyEntryRoute({
    journeySnapshot: journeySnapshot("active_learning", true),
    isEmailLink: true,
    emailIntent: EMAIL_LINK_INTENT_START_FIRST_SPRINT,
  });
  assert(
    staleEmail.route === "/portal" &&
      staleEmail.contextBannerCode === STALE_EMAIL_FIRST_SPRINT_BANNER,
    "Stale sprint deep links must redirect to portal with context banner"
  );

  const directStudy = resolveStudyEntryRoute({
    journeySnapshot: journeySnapshot("active_learning", true),
    isEmailLink: false,
  });
  assert(
    directStudy.route === "/portal/study",
    "Direct study navigation for active students should remain available"
  );
}

function assertPortalContextBannerCopy() {
  const copy = resolvePortalContextBanner(STALE_EMAIL_FIRST_SPRINT_BANNER);
  assert(
    copy?.includes("Ya completaste"),
    "Stale email banner copy should explain completed action context"
  );
  assert(
    resolvePortalContextBanner("unknown") === null,
    "Unknown portal context banner codes must be ignored"
  );
}

function main() {
  assertCallbackPreservesQuery();
  assertStudyEntryRoutingMatrix();
  assertPortalContextBannerCopy();

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks: {
          callbackQueryPreservation: "pass",
          studyEntryRouteMatrix: "pass",
          staleEmailContextBanner: "pass",
        },
      },
      null,
      2
    )
  );
}

main();
