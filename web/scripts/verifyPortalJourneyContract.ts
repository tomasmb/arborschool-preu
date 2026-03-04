import {
  AUTH_POST_LOGIN_CALLBACK_URL,
  resolveDiagnosticEntryRoute,
  resolveLandingPrimaryAction,
} from "@/lib/student/journeyRouting";
import {
  resolvePostLoginRouteByJourneyState,
  type StudentJourneyState,
} from "@/lib/student/journeyState";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertLandingPrimaryActionMatrix() {
  const signedOut = resolveLandingPrimaryAction({
    isAuthenticated: false,
    hasUserRecord: false,
  });
  assert(
    signedOut.href === AUTH_POST_LOGIN_CALLBACK_URL,
    "Signed-out landing CTA must route to auth post-login resolver"
  );

  const missingUserRecord = resolveLandingPrimaryAction({
    isAuthenticated: true,
    hasUserRecord: false,
  });
  assert(
    missingUserRecord.href === AUTH_POST_LOGIN_CALLBACK_URL,
    "Missing user record landing CTA must route to auth post-login resolver"
  );

  const planningRequiredNoProfile = resolveLandingPrimaryAction({
    isAuthenticated: true,
    hasUserRecord: true,
    journeySnapshot: {
      journeyState: "planning_required",
      hasPlanningProfile: false,
      hasDiagnosticSnapshot: false,
      hasActiveMission: false,
    },
  });
  assert(
    planningRequiredNoProfile.href === "/portal/goals?mode=planning",
    "Planning-required users without profile must be routed to planning mode"
  );

  const planningRequiredWithProfile = resolveLandingPrimaryAction({
    isAuthenticated: true,
    hasUserRecord: true,
    journeySnapshot: {
      journeyState: "planning_required",
      hasPlanningProfile: true,
      hasDiagnosticSnapshot: false,
      hasActiveMission: false,
    },
  });
  assert(
    planningRequiredWithProfile.href === "/diagnostico",
    "Planning-complete users without diagnostic snapshot must start diagnostic"
  );

  const diagnosticInProgress = resolveLandingPrimaryAction({
    isAuthenticated: true,
    hasUserRecord: true,
    journeySnapshot: {
      journeyState: "diagnostic_in_progress",
      hasPlanningProfile: true,
      hasDiagnosticSnapshot: false,
      hasActiveMission: false,
    },
  });
  assert(
    diagnosticInProgress.href === "/diagnostico",
    "In-progress users must resume diagnostic from landing"
  );

  const activationReady = resolveLandingPrimaryAction({
    isAuthenticated: true,
    hasUserRecord: true,
    journeySnapshot: {
      journeyState: "activation_ready",
      hasPlanningProfile: true,
      hasDiagnosticSnapshot: true,
      hasActiveMission: false,
    },
  });
  assert(
    activationReady.href === "/portal",
    "Activation-ready users must route to portal from landing"
  );

  const activeLearning = resolveLandingPrimaryAction({
    isAuthenticated: true,
    hasUserRecord: true,
    journeySnapshot: {
      journeyState: "active_learning",
      hasPlanningProfile: true,
      hasDiagnosticSnapshot: true,
      hasActiveMission: true,
    },
  });
  assert(
    activeLearning.href === "/portal",
    "Active-learning users must route to portal from landing"
  );
}

function assertDiagnosticEntryMatrix() {
  assert(
    resolveDiagnosticEntryRoute({
      journeyState: "planning_required",
      hasPlanningProfile: false,
    }) === "/portal/goals?mode=planning",
    "Diagnostic entry must enforce planning mode when planning profile is missing"
  );

  assert(
    resolveDiagnosticEntryRoute({
      journeyState: "planning_required",
      hasPlanningProfile: true,
    }) === "/diagnostico",
    "Planning-complete users should be allowed into diagnostic"
  );

  assert(
    resolveDiagnosticEntryRoute({
      journeyState: "diagnostic_in_progress",
      hasPlanningProfile: true,
    }) === "/diagnostico",
    "In-progress users should remain in diagnostic entry route"
  );

  assert(
    resolveDiagnosticEntryRoute({
      journeyState: "activation_ready",
      hasPlanningProfile: true,
    }) === "/portal",
    "Activation-ready users should be redirected from default diagnostic entry"
  );

  assert(
    resolveDiagnosticEntryRoute({
      journeyState: "active_learning",
      hasPlanningProfile: true,
    }) === "/portal",
    "Active-learning users should be redirected from default diagnostic entry"
  );
}

function assertPostLoginRouteMatrix() {
  const states: StudentJourneyState[] = [
    "planning_required",
    "diagnostic_in_progress",
    "activation_ready",
    "active_learning",
  ];

  const expectedRoutes = new Map<StudentJourneyState, string>([
    ["planning_required", "/portal/goals?mode=planning"],
    ["diagnostic_in_progress", "/diagnostico"],
    ["activation_ready", "/portal"],
    ["active_learning", "/portal"],
  ]);

  for (const state of states) {
    const route = resolvePostLoginRouteByJourneyState(state);
    assert(
      route === expectedRoutes.get(state),
      `Unexpected post-login route for state ${state}: ${route}`
    );
  }
}

function main() {
  assertLandingPrimaryActionMatrix();
  assertDiagnosticEntryMatrix();
  assertPostLoginRouteMatrix();

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks: {
          landingPrimaryActionMatrix: "pass",
          diagnosticEntryMatrix: "pass",
          postLoginRouteMatrix: "pass",
        },
      },
      null,
      2
    )
  );
}

main();
