import { Link } from "@tanstack/react-router";
import { ArrowRight, Radio } from "lucide-react";
import { Motif } from "@/components/site/motif";
import { VideoPlayer } from "@/components/story/video-player";
import { t } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

/** Five bars at fixed heights; the waveform animation does the rest. */
const WAVE_BARS = ["h-2", "h-4", "h-2.5", "h-3.5", "h-2"];

function LiveBadge({ onAir }: { onAir: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 bg-live px-3 py-1.5 text-[11px] font-black tracking-[0.14em] text-live-foreground uppercase">
      <span
        className={cn("size-2 rounded-full bg-live-foreground", onAir && "signal-pulse")}
        aria-hidden="true"
      />
      {onAir ? t.liveNow : t.liveStandby}
      <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
        {WAVE_BARS.map((height, index) => (
          <span
            key={index}
            className={cn("live-wave w-0.5 origin-bottom rounded-full bg-live-foreground", height)}
            style={{ animationDelay: `${index * 0.13}s` }}
          />
        ))}
      </span>
    </span>
  );
}

/**
 * The live banner. Where the masthead carries a compact "Watch live" button,
 * this is the loud version: a broadcast strip on a navy-to-blue gradient, with
 * the show's name set large, one line of description, and one primary route
 * into the broadcast. Red is used for the badge alone — it is the live mark.
 *
 * With an embeddable stream the player takes a column on the left; without one
 * the copy simply breathes across the band. The whole strip stays between 120
 * and 160px on a large screen.
 */
export function LiveStrip({ live, className }: { live: SiteSettings["live"]; className?: string }) {
  const embeddable = Boolean(live.video?.embeddable && live.video);

  return (
    <section
      aria-label={t.watchLive}
      className={cn("surface-blue relative text-navy-foreground", className)}
    >
      <Motif />
      <div className="page-shell relative z-10 flex flex-col gap-4 py-4 lg:min-h-[150px] lg:flex-row lg:items-center">
        {embeddable && live.video ? (
          <div className="w-full shrink-0 overflow-hidden rounded-card border border-navy-foreground/20 shadow-lift lg:w-60">
            <VideoPlayer video={live.video} poster={live.video.thumbnail_url} />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <LiveBadge onAir={live.isLive} />

          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-[1.05] font-black text-balance sm:text-3xl">
              {live.title}
            </h2>
            {live.description ? (
              <p className="mt-1 line-clamp-1 text-sm text-navy-foreground/75">
                {live.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 bg-live px-5 py-3 text-[11px] font-black tracking-[0.12em] text-live-foreground uppercase transition-colors hover:bg-live/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
          >
            <Radio className="size-3.5" aria-hidden="true" />
            {t.watchLive}
          </Link>
          <Link
            to="/schedule"
            className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[0.12em] text-navy-foreground/80 uppercase transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
          >
            {t.fullSchedule}
            <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
