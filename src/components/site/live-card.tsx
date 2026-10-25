import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { VideoPlayer } from "@/components/story/video-player";
import { t } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

/**
 * The live card beside the category tiles: a navy card with the red LIVE badge,
 * the show's name and one route into the broadcast. When the API has resolved an
 * embeddable stream it plays here; otherwise the card is just the call to watch.
 */
export function LiveCard({ live, className }: { live: SiteSettings["live"]; className?: string }) {
  const configured =
    live.title.trim() !== "" || live.streamUrl.trim() !== "" || Boolean(live.video);
  if (!configured) return null;

  const embeddable = Boolean(live.video?.embeddable && live.video);

  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-3 rounded-card bg-navy p-4 text-navy-foreground shadow-card",
        className,
      )}
    >
      <span className="inline-flex w-fit items-center gap-2 bg-live px-2.5 py-1 text-[10px] font-black tracking-[0.14em] text-live-foreground uppercase">
        <span
          className={cn("size-1.5 rounded-full bg-live-foreground", live.isLive && "signal-pulse")}
          aria-hidden="true"
        />
        {live.isLive ? t.liveNow : t.liveStandby}
      </span>

      <div className="min-w-0">
        <h2 className="text-lg leading-tight font-extrabold text-balance">
          {live.title || t.watchLive}
        </h2>
        {live.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-navy-foreground/70">{live.description}</p>
        ) : null}
      </div>

      {embeddable && live.video ? (
        <div className="overflow-hidden rounded-sm border border-navy-foreground/20">
          <VideoPlayer video={live.video} poster={live.video.thumbnail_url} />
        </div>
      ) : null}

      <Link
        to="/live"
        className="mt-auto inline-flex items-center justify-center gap-2 bg-live px-4 py-2.5 text-[11px] font-black tracking-[0.12em] text-live-foreground uppercase transition-colors hover:bg-live/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Play className="size-3.5 fill-current" aria-hidden="true" />
        {t.watchLive}
      </Link>
    </aside>
  );
}
