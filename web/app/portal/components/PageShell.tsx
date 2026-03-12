import type { ReactNode } from "react";
import { PortalTopNav, PortalBottomNav } from "./PortalNav";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Hide global nav (e.g. during planning wizard) */
  hideNav?: boolean;
};

export function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  hideNav = false,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-off-white text-foreground">
      {!hideNav && <PortalTopNav />}

      <main className="px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {eyebrow ? (
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm text-gray-600 max-w-3xl">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>

      {!hideNav && <PortalBottomNav />}
    </div>
  );
}
