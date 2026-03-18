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
    href: "/portal/progress",
    label: "Progreso",
    icon: (active) => (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0
            015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94
            2.28l-2.28 5.941"
        />
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
