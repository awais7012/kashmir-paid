import { Youtube } from "lucide-react";
import { Motif } from "@/components/site/motif";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The subscribe block. It only exists if the desk has published a YouTube
 * address — with no channel there is nothing to subscribe to, so the whole
 * block disappears rather than sitting there empty.
 *
 * It is the one place the YouTube red is used, held apart from the live mark.
 */
export function SubscribeBanner({ href, className }: { href: string; className?: string }) {
  if (!href.trim()) return null;

  return (
    <aside
      className={cn(
        "surface-brand relative grid gap-3 overflow-hidden p-5 text-navy-foreground shadow-card",
        className,
      )}
    >
      <Motif className="opacity-[0.07]" />
      <span className="relative z-10 inline-flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-sky uppercase">
        <Youtube className="size-4" aria-hidden="true" />
        {t.subscribe}
      </span>
      <p className="relative z-10 text-sm leading-relaxed text-navy-foreground/80">
        {t.subscribeBody}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="relative z-10 mt-1 inline-flex w-fit items-center gap-2 bg-youtube px-4 py-2.5 text-xs font-black tracking-[0.1em] text-youtube-foreground uppercase transition-colors hover:bg-youtube/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
      >
        <Youtube className="size-4" aria-hidden="true" />
        {t.subscribeCta}
      </a>
    </aside>
  );
}
