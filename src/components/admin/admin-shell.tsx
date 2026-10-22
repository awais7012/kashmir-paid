import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarDays,
  Home,
  Image as ImageIcon,
  Newspaper,
  PenLine,
  Radio,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { adminButton } from "@/components/admin/controls";
import type { AdminUser } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type NavItem = {
  to:
    | "/admin"
    | "/admin/stories"
    | "/admin/new"
    | "/admin/schedule"
    | "/admin/live"
    | "/admin/media"
    | "/admin/settings"
    | "/admin/account";
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { to: "/admin", label: "Home", icon: Home },
  { to: "/admin/stories", label: "Stories", icon: Newspaper },
  { to: "/admin/new", label: "New story", icon: PenLine },
  { to: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/admin/live", label: "Go live", icon: Radio },
  { to: "/admin/media", label: "Photos & videos", icon: ImageIcon },
  { to: "/admin/settings", label: "Website", icon: Settings },
  { to: "/admin/account", label: "Account", icon: UserRound },
];

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

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-foreground bg-card lg:flex">
          <div className="border-b-2 border-foreground px-5 py-5">
            <Link
              to="/admin"
              className="flex items-baseline gap-2 font-display text-2xl leading-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <span>Global Kashmir</span>
              <span className="text-primary">Studio</span>
            </Link>
            <p className="mt-2 truncate text-[10px] font-black tracking-[0.14em] text-muted-foreground uppercase">
              {admin ? admin.email : "Editor"}
            </p>
          </div>

          <nav aria-label="Studio" className="flex-1 overflow-y-auto p-3">
            <ul className="grid gap-1">
              {navItems.map((item) => {
                const active = isActive(pathname, item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-[12px] font-black tracking-[0.1em] uppercase transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        active ? "bg-foreground text-background" : "hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t-2 border-foreground p-3">
            <button
              type="button"
              onClick={onSignOut}
              className={cn(adminButton({ variant: "outline", size: "sm" }), "w-full")}
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b-2 border-foreground bg-card lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Link
                to="/admin"
                className="font-display text-xl leading-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                Global Kashmir <span className="text-primary">Studio</span>
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className={adminButton({ variant: "outline", size: "sm" })}
              >
                Sign out
              </button>
            </div>
            <nav aria-label="Studio" className="overflow-x-auto border-t border-border">
              <ul className="flex min-w-max items-center gap-1 px-3 py-2">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "inline-flex px-3 py-2 text-[11px] font-black tracking-[0.1em] whitespace-nowrap uppercase transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                          active ? "bg-foreground text-background" : "hover:text-primary",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </header>

          <main id="studio-main" className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
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
