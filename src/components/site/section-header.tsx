import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The heading over a section: a clean title, a way to the full section on the
 * other edge, and a thick green block on the rule beneath. Nothing sits behind
 * the title — the green block is the whole accent.
 */
export function SectionHeader({
  title,
  tone = "light",
  action,
  className,
}: {
  title: string;
  tone?: "light" | "dark";
  action?: ReactNode;
  className?: string | undefined;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "relative flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 pb-3",
        dark ? "border-background/25" : "border-foreground",
        className,
      )}
    >
      <h2
        className={cn(
          "font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.05] font-black tracking-tight text-balance",
          dark && "text-background",
        )}
      >
        {title}
      </h2>
      {action}
      <span
        className="absolute -bottom-[2px] start-0 h-1.5 w-20 bg-green sm:w-24"
        aria-hidden="true"
      />
    </div>
  );
}

const VIEW_ALL_CLASS =
  "inline-flex items-center gap-1.5 pb-1 text-[11px] font-black tracking-[0.12em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** "View all" for a fixed route. */
export function ViewAllLink({
  to,
  label,
  tone = "light",
}: {
  to: "/news" | "/live" | "/schedule";
  label: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link
      to={to}
      className={cn(
        VIEW_ALL_CLASS,
        tone === "dark"
          ? "text-background/80 hover:text-background"
          : "text-muted-foreground hover:text-primary",
      )}
    >
      {label}
      <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}

/** "View all" for a category section. */
export function ViewAllSectionLink({
  slug,
  label,
  tone = "light",
}: {
  slug: string;
  label: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link
      to="/section/$category"
      params={{ category: slug }}
      className={cn(
        VIEW_ALL_CLASS,
        tone === "dark"
          ? "text-background/80 hover:text-background"
          : "text-muted-foreground hover:text-primary",
      )}
    >
      {label}
      <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}
