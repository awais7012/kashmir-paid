import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The one red call to action on the page. Red is reserved for live and
 * breaking marks, and this is the live one, so it carries the pulsing dot.
 */
export function LiveButton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to="/live"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 bg-live font-black tracking-[0.1em] text-live-foreground uppercase transition-colors hover:bg-live/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        compact ? "px-3 py-2 text-[11px]" : "px-4 py-2.5 text-xs",
        className,
      )}
    >
      <span
        className="signal-pulse size-2 shrink-0 rounded-full bg-live-foreground"
        aria-hidden="true"
      />
      <Play className="size-3.5 fill-current" aria-hidden="true" />
      {t.watchLive}
    </Link>
  );
}
