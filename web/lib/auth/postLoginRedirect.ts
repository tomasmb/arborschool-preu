import {
  type StudentJourneyState,
  resolvePostLoginRouteByJourneyState,
} from "@/lib/student/journeyState";

type ResolvePostLoginRedirectParams =
  | {
      isStudentPortalEnabled: boolean;
      hasDiagnosticSnapshot: boolean;
      journeyState?: never;
    }
  | {
      isStudentPortalEnabled: boolean;
      hasDiagnosticSnapshot?: boolean;
      journeyState: StudentJourneyState;
    };

export function resolvePostLoginRedirect(
  params: ResolvePostLoginRedirectParams
) {
  if (!params.isStudentPortalEnabled) {
    return "/diagnostico" as const;
  }

  if ("journeyState" in params && params.journeyState) {
    return resolvePostLoginRouteByJourneyState(params.journeyState);
  }

  if (params.isStudentPortalEnabled && params.hasDiagnosticSnapshot) {
    return "/portal" as const;
  }

  return "/portal/goals?mode=planning" as const;
}
