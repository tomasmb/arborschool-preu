import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-white to-off-white text-foreground px-4 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {eyebrow ? (
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-serif font-bold text-primary">
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
  );
}
