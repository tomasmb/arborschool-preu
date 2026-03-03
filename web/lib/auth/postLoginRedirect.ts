type ResolvePostLoginRedirectParams = {
  isStudentPortalEnabled: boolean;
  hasDiagnosticSnapshot: boolean;
};

export function resolvePostLoginRedirect(
  params: ResolvePostLoginRedirectParams
): "/portal" | "/diagnostico" {
  if (params.isStudentPortalEnabled && params.hasDiagnosticSnapshot) {
    return "/portal";
  }

  return "/diagnostico";
}
