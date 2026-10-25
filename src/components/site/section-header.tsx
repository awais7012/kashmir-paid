import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The heading over a section: a bold sans title with a short blue underline, and
 * a way to the full section on the other edge. The blue bar is the whole accent.
 */
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-2", className)}>
      <h2 className="border-b-[3px] border-brand-blue pb-1.5 font-sans text-[clamp(1.25rem,2vw,1.75rem)] leading-tight font-extrabold tracking-tight text-balance">
        {title}
      </h2>
      {action}
    </div>
  );
}

const VIEW_ALL_CLASS =
  "inline-flex items-center gap-1.5 pb-1 text-[11px] font-black tracking-[0.1em] text-brand-blue uppercase transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** "View all" for a fixed route. */
export function ViewAllLink({ to, label }: { to: "/news" | "/live" | "/schedule"; label: string }) {
  return (
    <Link to={to} className={VIEW_ALL_CLASS}>
      {label}
      <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}

/** "View all" for a category section. */
export function ViewAllSectionLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link to="/section/$category" params={{ category: slug }} className={VIEW_ALL_CLASS}>
      {label}
      <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}
