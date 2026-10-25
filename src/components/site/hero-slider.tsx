import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BrandedFallback } from "@/components/story/branded-fallback";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
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
};

function toSlides(stories: Story[]): Slide[] {
  return stories.slice(0, MAX_SLIDES).map((story) => ({
    key: story.id,
    src: mediaUrl(story.hero_thumb_url) ?? mediaUrl(story.hero_image_url),
    slug: story.slug,
    title: story.title,
    category: story.category,
  }));
}

/**
 * The hero: the top stories as full-bleed pictures, with nothing laid over them.
 *
 * The frame carries no headline, chip, date or button — the desk's artwork is
 * the whole slide, so an editor who wants words on it puts them in the picture.
 * Each frame links to its story, and the headline is the link's accessible name
 * and the picture's alt text.
 *
 * Pictures crossfade so the frame never jumps. It advances on its own and can be
 * driven with the dots, the arrows, a swipe or the left/right keys. It holds
 * still while hovered or focused, and never rotates for readers who ask for
 * reduced motion.
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
            ) : (
              /* No picture: the brand plate stands in, exactly as it does on a card. */
              <BrandedFallback category={item.category} />
            )}

            {/* The whole frame is the link. There is no copy over the picture —
                artwork that carries its own words is uploaded that way. */}
            <Link
              to="/story/$slug"
              params={{ slug: item.slug }}
              tabIndex={isActive ? 0 : -1}
              aria-label={item.title}
              className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-white"
            />
          </div>
        );
      })}

      {/* Dots, top-right. */}
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
                /* With no scrim behind them any more, the dots need their own edge
                   so they stay visible on a light poster. */
                "size-2 rounded-full ring-1 ring-black/30 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                position === active ? "w-5 bg-white" : "bg-white/60 hover:bg-white/85",
              )}
            />
          ))}
        </div>
      ) : null}

      {/* Arrows, right edge. */}
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
