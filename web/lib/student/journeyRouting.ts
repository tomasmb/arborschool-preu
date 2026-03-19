import { buildSignInUrlWithCallback } from "@/lib/auth/callbackUrl";
import type { StudentJourneySnapshot } from "./journeyState";

export interface LandingPrimaryAction {
  label: string;
  href: string;
  supportingText: string;
  journeyState:
    | "anonymous"
    | "planning_required"
    | "diagnostic_in_progress"
    | "activation_ready"
    | "active_learning";
}

export const AUTH_POST_LOGIN_CALLBACK_URL =
  buildSignInUrlWithCallback("/auth/post-login");
export const AUTH_DIAGNOSTIC_CALLBACK_URL =
  buildSignInUrlWithCallback("/diagnostico");

export const EMAIL_LINK_SOURCE_PARAM = "source";
export const EMAIL_LINK_INTENT_PARAM = "intent";
export const EMAIL_LINK_SOURCE_VALUE = "email";
export const EMAIL_LINK_INTENT_START_FIRST_STUDY = "start_first_sprint";

export const PORTAL_CONTEXT_BANNER_PARAM = "context";
export const STALE_EMAIL_FIRST_STUDY_BANNER = "stale_email_first_sprint";
export type PortalContextBannerCode = typeof STALE_EMAIL_FIRST_STUDY_BANNER;

const PLANNING_ROUTE = "/portal/goals?mode=planning";
const DIAGNOSTIC_ROUTE = "/diagnostico";
const PORTAL_ROUTE = "/portal";
const STUDY_ROUTE = "/portal/study";

export function resolveLandingPrimaryAction(params: {
  isAuthenticated: boolean;
  hasUserRecord: boolean;
  journeySnapshot?: StudentJourneySnapshot;
}): LandingPrimaryAction {
  if (!params.isAuthenticated) {
    return {
      label: "Crear mi plan y empezar diagnóstico",
      href: AUTH_POST_LOGIN_CALLBACK_URL,
      supportingText:
        "Define tu meta, completa el diagnóstico (~15 min) y arranca tu primera mini-clase.",
      journeyState: "anonymous",
    };
  }

  if (!params.hasUserRecord || !params.journeySnapshot) {
    return {
      label: "Iniciar sesión para continuar",
      href: AUTH_POST_LOGIN_CALLBACK_URL,
      supportingText: "Entrar toma menos de un minuto y conserva tu progreso.",
      journeyState: "anonymous",
    };
  }

  if (params.journeySnapshot.journeyState === "planning_required") {
    return {
      label: "Continuar planificación",
      href: PLANNING_ROUTE,
      supportingText: params.journeySnapshot.hasPlanningProfile
        ? "Tu meta ya está guardada. Revisa la planificación y activa tu diagnóstico (15 min)."
        : "Define tu meta en 5 min para desbloquear tu diagnóstico personalizado.",
      journeyState: "planning_required",
    };
  }

  if (params.journeySnapshot.journeyState === "diagnostic_in_progress") {
    return {
      label: "Retomar diagnóstico",
      href: DIAGNOSTIC_ROUTE,
      supportingText: "Retomas desde donde quedaste, sin perder respuestas.",
      journeyState: "diagnostic_in_progress",
    };
  }

  return {
    label: "Ir a mi portal",
    href: PORTAL_ROUTE,
    supportingText:
      "Revisa tu misión semanal y ejecuta la siguiente mejor acción.",
    journeyState: params.journeySnapshot.journeyState,
  };
}

export function resolveDiagnosticEntryRoute(
  journeySnapshot: Pick<
    StudentJourneySnapshot,
    "journeyState" | "hasPlanningProfile"
  >
): "/diagnostico" | "/portal/goals?mode=planning" | "/portal" {
  if (journeySnapshot.journeyState === "planning_required") {
    if (journeySnapshot.hasPlanningProfile) {
      return DIAGNOSTIC_ROUTE;
    }
    return PLANNING_ROUTE;
  }

  if (journeySnapshot.journeyState === "diagnostic_in_progress") {
    return DIAGNOSTIC_ROUTE;
  }

  if (
    journeySnapshot.journeyState === "activation_ready" ||
    journeySnapshot.journeyState === "active_learning"
  ) {
    return PORTAL_ROUTE;
  }

  return DIAGNOSTIC_ROUTE;
}

export function resolveStudyEntryRoute(params: {
  journeySnapshot: Pick<
    StudentJourneySnapshot,
    "journeyState" | "hasPlanningProfile"
  >;
  isEmailLink: boolean;
  emailIntent?: string | null;
}): {
  route:
    | "/portal/study"
    | "/portal/goals?mode=planning"
    | "/diagnostico"
    | "/portal";
  contextBannerCode?: PortalContextBannerCode;
} {
  const { journeyState } = params.journeySnapshot;

  if (journeyState === "active_learning") {
    if (
      params.isEmailLink &&
      params.emailIntent === EMAIL_LINK_INTENT_START_FIRST_STUDY
    ) {
      return {
        route: PORTAL_ROUTE,
        contextBannerCode: STALE_EMAIL_FIRST_STUDY_BANNER,
      };
    }
    return { route: STUDY_ROUTE };
  }

  if (journeyState === "planning_required") {
    return { route: PLANNING_ROUTE };
  }

  if (journeyState === "diagnostic_in_progress") {
    return { route: DIAGNOSTIC_ROUTE };
  }

  // activation_ready: user completed the diagnostic, allow study
  // even if they haven't created a planning profile yet.
  if (journeyState === "activation_ready") {
    return { route: STUDY_ROUTE };
  }

  return { route: STUDY_ROUTE };
}

export function resolvePortalContextBanner(
  code: string | null | undefined
): string | null {
  if (code === STALE_EMAIL_FIRST_STUDY_BANNER) {
    return "Ya completaste esa primera mini-clase. Te llevamos a tu misión actual.";
  }

  return null;
}
