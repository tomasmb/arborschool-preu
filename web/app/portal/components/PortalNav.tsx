"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  matchExact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/portal",
    label: "Inicio",
    matchExact: true,
    icon: (active) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        {active ? (
          <>
            <path
              fill="currentColor"
              d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"
            />
            <path
              fill="currentColor"
              d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"
            />
          </>
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75
              12M4.5 9.75v10.125c0 .621.504 1.125 1.125
              1.125H9.75v-4.875c0-.621.504-1.125
              1.125-1.125h2.25c.621 0 1.125.504 1.125
              1.125V21h4.125c.621 0 1.125-.504
              1.125-1.125V9.75M8.25 21h8.25"
          />
        )}
      </svg>
    ),
  },
  {
    href: "/portal/study",
    label: "Estudiar",
    icon: (active) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        {active ? (
          <>
            <path
              fill="currentColor"
              d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z"
            />
            <path
              fill="currentColor"
              d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z"
            />
            <path
              fill="currentColor"
              d="M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z"
            />
          </>
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.26 10.147a60.438 60.438 0 00-.491
              6.347A48.62 48.62 0 0112
              20.904a48.62 48.62 0 018.232-4.41
              60.46 60.46 0
              00-.491-6.347m-15.482
              0a50.636 50.636 0 00-2.658-.813A59.906
              59.906 0 0112 3.493a59.903
              59.903 0 0110.399 5.84 51.39 51.39 0
              00-2.658.814m-15.482 0A50.717
              50.717 0 0112 13.489a50.702 50.702 0
              007.74-3.342M6.75
              15v-3.75m0 0l3-3m-3 3l-3-3"
          />
        )}
      </svg>
    ),
  },
  {
    href: "/portal/progress",
    label: "Progreso",
    icon: (active) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        {active ? (
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.22 6.268a.75.75 0 0 1 .968-.432l5.942
              2.28a.75.75 0 0 1 .431.97l-2.28 5.941a.75.75
              0 1 1-1.4-.537l1.48-3.856-6.398 5.89a.75.75 0
              0 1-1.056-.036L9.47 13.052l-6.22 6.22a.75.75 0
              0 1-1.06-1.06l6.75-6.75a.75.75 0 0 1 1.07.02
              l3.358 3.446 5.782-5.327-1.005 2.622a.75.75 0
              1 1-1.4-.536l.455-1.188Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0
              015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94
              2.28l-2.28 5.941"
          />
        )}
      </svg>
    ),
  },
  {
    href: "/portal/goals",
    label: "Metas",
    icon: (active) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        {active ? (
          <path
            fill="currentColor"
            d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125
              12h2.25c.621 0 1.125.504 1.125
              1.125v6.75C7.5 20.496 6.996 21 6.375
              21h-2.25A1.125 1.125 0 013
              19.875v-6.75zM9.75 8.625c0-.621.504-1.125
              1.125-1.125h2.25c.621 0 1.125.504 1.125
              1.125v11.25c0 .621-.504 1.125-1.125
              1.125h-2.25a1.125 1.125 0
              01-1.125-1.125V8.625zM16.5
              4.125c0-.621.504-1.125
              1.125-1.125h2.25C20.496 3 21 3.504 21
              4.125v15.75c0 .621-.504 1.125-1.125
              1.125h-2.25a1.125 1.125 0
              01-1.125-1.125V4.125z"
          />
        )}
      </svg>
    ),
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchExact) return pathname === item.href;
  return pathname.startsWith(item.href);
}

function ProfileLink() {
  const pathname = usePathname();
  const active = pathname.startsWith("/portal/profile");

  return (
    <Link
      href="/portal/profile"
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2",
        "text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      ].join(" ")}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {active ? (
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0
              017.5 0zM4.501 20.118a7.5 7.5 0
              0114.998 0A17.933 17.933 0 0112
              21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        )}
      </svg>
      <span className="hidden lg:inline">Perfil</span>
    </Link>
  );
}

/** Desktop top navigation bar */
export function PortalTopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden sm:block sticky top-0 z-30
        bg-white/90 backdrop-blur-lg border-b border-gray-100"
    >
      <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/portal" className="flex items-center gap-2 shrink-0">
          <Image src="/logo-arbor.svg" alt="Arbor" width={28} height={28} />
          <span className="text-lg font-serif font-bold text-primary">
            Arbor PreU
          </span>
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-2 rounded-lg px-3 py-2",
                  "text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                ].join(" ")}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            );
          })}
        </div>

        <ProfileLink />
      </div>
    </nav>
  );
}

/** Mobile bottom tab bar */
export function PortalBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-30
        bg-white/95 backdrop-blur-lg border-t border-gray-200
        safe-area-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center gap-0.5 px-3 py-1 relative",
                "text-[11px] font-medium transition-all duration-200 min-w-[64px]",
                active ? "text-primary" : "text-gray-400",
              ].join(" ")}
            >
              <span
                className={`transition-transform duration-200 overflow-visible ${active ? "scale-110" : ""}`}
              >
                {item.icon(active)}
              </span>
              {item.label}
              {active && (
                <span className="absolute -bottom-1 w-6 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {(() => {
          const profileActive = pathname.startsWith("/portal/profile");
          return (
            <Link
              href="/portal/profile"
              className={[
                "flex flex-col items-center gap-0.5 px-3 py-1 relative",
                "text-[11px] font-medium transition-all duration-200 min-w-[64px]",
                profileActive ? "text-primary" : "text-gray-400",
              ].join(" ")}
            >
              <span
                className={`transition-transform duration-200 overflow-visible ${profileActive ? "scale-110" : ""}`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  {profileActive ? (
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    />
                  ) : (
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0
                        017.5 0zM4.501 20.118a7.5 7.5 0
                        0114.998 0A17.933 17.933 0 0112
                        21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  )}
                </svg>
              </span>
              Perfil
              {profileActive && (
                <span className="absolute -bottom-1 w-6 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })()}
      </div>
    </nav>
  );
}
