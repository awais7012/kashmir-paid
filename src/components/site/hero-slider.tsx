import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { CategoryChip } from "@/components/story/category-chip";
import { timeAgo } from "@/lib/format";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { isUrdu, storyTextAttrs, URDU_DISPLAY_CLASS, URDU_TITLE_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/** One rotation, in ms. */
const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD_PX = 45;
/** The five frames the hero rotates. */
const MAX_SLIDES = 5;

type Slide = {
  key: string;
  src: string | null;
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  hasVideo: boolean;
  language: Story["language"];
};

function toSlides(stories: Story[]): Slide[] {
  return stories.slice(0, MAX_SLIDES).map((story) => ({
    key: story.id,
    src: mediaUrl(story.hero_thumb_url) ?? mediaUrl(story.hero_image_url),
    slug: story.slug,
    title: story.title,
    category: story.category,
    publishedAt: story.published_at,
    hasVideo: story.has_video,
    language: story.language,
  }));
}

/**
 * The hero. Pictures crossfade so the frame never jumps. The scrim covers only
 * the bottom half, so the photograph stays bright, and the copy sits on that
 * half with the dots and arrows placed clear of it.
 *
 * It advances on its own and can be driven with the dots, the arrows, a swipe or
 * the left/right keys. It holds still while hovered or focused, and never
 * rotates for readers who ask for reduced motion.
 */
export function HeroSlider({ stories, className }: { stories: Story[]; className?: string }) {
  const items = useMemo(() => toSlides(stories), [stories]);
  const count = items.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  // Every frame is absolutely positioned inside one aspect-video box, so without
  // this the browser treats all five as in-viewport and downloads every hero
  // picture at once. Frames that have been shown keep their image mounted, which
  // keeps the crossfade while loading just one picture at the start.
  const [shown, setShown] = useState<number[]>([0]);

  // A stale index after the list shrinks would blank the frame.
  const active = count > 0 ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    setShown((prev) => (prev.includes(active) ? prev : [...prev, active]));
  }, [active]);

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, step]);

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t.topStories}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-card bg-foreground",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") step(-1);
        if (event.key === "ArrowRight") step(1);
      }}
      tabIndex={count > 1 ? 0 : -1}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX ?? null;
        touchStartX.current = null;
        if (start === null || end === null) return;
        const travel = end - start;
        if (Math.abs(travel) < SWIPE_THRESHOLD_PX) return;
        step(travel < 0 ? 1 : -1);
      }}
    >
      {items.map((item, position) => {
        const isActive = position === active;
        const urdu = isUrdu(item.language);
        const textAttrs = storyTextAttrs(item.language);

        return (
          <div
            key={item.key}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
              isActive ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {item.src && shown.includes(position) ? (
              <img
                src={item.src}
                alt={item.title}
                loading={position === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={position === 0 ? "high" : "auto"}
                className="h-full w-full object-cover"
              />
            ) : null}

            {/* The scrim covers only the bottom half, so the picture reads bright. */}
            <span
              className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/90 via-foreground/45 to-transparent"
              aria-hidden="true"
            />

            <span className="absolute inset-x-0 bottom-0 block p-4 sm:p-6 lg:p-8">
              <span className="grid max-w-2xl gap-2.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center bg-brand-blue px-2 py-1 text-[10px] font-black tracking-[0.14em] text-brand-blue-foreground uppercase">
                    {t.topStory}
                  </span>
                  {item.category ? <CategoryChip label={item.category} /> : null}
                  {item.hasVideo ? (
                    <span className="inline-flex items-center gap-1 bg-navy px-2 py-1 text-[10px] font-black tracking-[0.14em] text-navy-foreground uppercase">
                      <Play className="size-3 fill-current" aria-hidden="true" />
                      {t.video}
                    </span>
                  ) : null}
                </span>

                <Link
                  to="/story/$slug"
                  params={{ slug: item.slug }}
                  tabIndex={isActive ? 0 : -1}
                  {...textAttrs}
                  className={cn(
                    "line-clamp-3 font-display text-[clamp(1.5rem,3vw,2.6rem)] leading-[1.08] font-bold text-balance text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                    urdu && URDU_DISPLAY_CLASS,
                  )}
                >
                  {item.title}
                </Link>

                <span className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold tracking-[0.06em] text-white/75 uppercase">
                    <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time>
                  </span>
                  <Link
                    to="/story/$slug"
                    params={{ slug: item.slug }}
                    tabIndex={isActive ? 0 : -1}
                    className={cn(
                      "inline-flex items-center gap-1.5 bg-card px-3.5 py-2 text-[11px] font-black tracking-[0.1em] text-navy uppercase transition-colors hover:bg-brand-blue hover:text-brand-blue-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                      urdu && URDU_TITLE_CLASS,
                    )}
                  >
                    {t.readMore}
                    <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </span>
              </span>
            </span>
          </div>
        );
      })}

      {/* Dots, top-right, clear of the copy. */}
      {count > 1 ? (
        <div className="absolute top-3 end-3 z-20 flex items-center gap-1.5">
          {items.map((item, position) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={item.title}
              aria-current={position === active}
              className={cn(
                "size-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                position === active ? "w-5 bg-white" : "bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      ) : null}

      {/* Arrows, right edge, clear of the copy. */}
      {count > 1 ? (
        <div className="absolute end-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous story"
            className="grid size-10 place-items-center rounded-full bg-foreground/50 text-white backdrop-blur transition-colors hover:bg-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next story"
            className="grid size-10 place-items-center rounded-full bg-foreground/50 text-white backdrop-blur transition-colors hover:bg-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        Story {active + 1} of {count}
      </p>
    </div>
  );
}
