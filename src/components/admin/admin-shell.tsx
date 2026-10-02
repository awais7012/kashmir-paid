import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { adminButton } from "@/components/admin/controls";
import type { AdminUser } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Stories" },
  { to: "/admin/new", label: "New story" },
  { to: "/admin/live", label: "Live" },
  { to: "/admin/media", label: "Media" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/account", label: "Account" },
] as const;

function isActive(pathname: string, to: string): boolean {
  if (to === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AdminShell({
  admin,
  onSignOut,
  children,
}: {
  admin: AdminUser | null;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#studio-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-foreground focus:px-4 focus:py-2 focus:text-xs focus:font-black focus:tracking-[0.1em] focus:text-background focus:uppercase"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b-2 border-foreground bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/admin"
            className="flex items-baseline gap-2 font-display text-2xl leading-none"
          >
            <span>Global Kashmir</span>
            <span className="text-primary">Studio</span>
          </Link>

          <nav aria-label="Studio" className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "px-3 py-2 text-[11px] font-black tracking-[0.12em] uppercase transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    active ? "bg-foreground text-background" : "hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {admin ? (
              <span className="hidden text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase sm:inline">
                {admin.email}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onSignOut}
              className={adminButton({ variant: "outline", size: "sm" })}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main id="studio-main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

export function StudioSplash({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <p
        role="status"
        className="text-[11px] font-black tracking-[0.2em] text-muted-foreground uppercase"
      >
        {label}
      </p>
    </div>
  );
}
