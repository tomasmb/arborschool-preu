import {
  type StudentJourneyState,
  resolvePostLoginRouteByJourneyState,
} from "@/lib/student/journeyState";

type ResolvePostLoginRedirectParams = {
  hasDiagnosticSnapshot?: boolean;
  journeyState?: StudentJourneyState;
};

export function resolvePostLoginRedirect(
  params: ResolvePostLoginRedirectParams
) {
  if ("journeyState" in params && params.journeyState) {
    return resolvePostLoginRouteByJourneyState(params.journeyState);
  }

  if (params.hasDiagnosticSnapshot) {
    return "/portal" as const;
  }

  return "/portal/goals?mode=planning" as const;
}
