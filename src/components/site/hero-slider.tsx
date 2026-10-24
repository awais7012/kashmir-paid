import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import type { HeroSlide } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6500;
const SWIPE_THRESHOLD_PX = 45;

type Slide = {
  key: string;
  kind: "image" | "video";
  src: string;
  /** Set when the slide is an advert; the whole slide then becomes a link. */
  link: string;
};

/**
 * The homepage hero: full-bleed pictures and videos only, with no headline or
 * button laid over them. It advances on its own, and visitors can step through
 * it with the arrows, the dots, a swipe or the left/right arrow keys.
 */
export function HeroSlider({
  slides,
  fallbackImage,
}: {
  slides: HeroSlide[];
  /** Used until the editor uploads something, so the homepage is never empty. */
  fallbackImage: string | null;
}) {
  const items = useMemo<Slide[]>(() => {
    const uploaded = slides.flatMap((slide, position) => {
      const src = mediaUrl(slide.url);
      return src
        ? [{ key: `${slide.url}-${position}`, kind: slide.kind, src, link: slide.link }]
        : [];
    });
    if (uploaded.length > 0) return uploaded;
    return fallbackImage ? [{ key: "fallback", kind: "image", src: fallbackImage, link: "" }] : [];
  }, [slides, fallbackImage]);

  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // A stale index after the editor removes slides would blank the hero.
  const active = count > 0 ? Math.min(index, count - 1) : 0;

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
      aria-label="Global Kashmir TV highlights"
      className="relative h-full min-h-[280px] w-full overflow-hidden bg-foreground sm:min-h-[420px] lg:min-h-[560px]"
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
        const media =
          item.kind === "video" ? (
            isActive ? (
              <video
                src={item.src}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="h-full w-full bg-foreground" />
            )
          ) : (
            <img
              src={item.src}
              alt=""
              loading={position === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          );

        return (
          <div
            key={item.key}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
              isActive ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {item.link ? (
              // An advert slide: the whole frame opens the advertiser's page.
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                aria-label="Sponsored link"
                tabIndex={isActive ? 0 : -1}
                className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"
              >
                {media}
              </a>
            ) : (
              media
            )}
          </div>
        );
      })}

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous slide"
            className="absolute top-1/2 left-2 grid size-10 -translate-y-1/2 place-items-center bg-foreground/70 text-background transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:left-4 sm:size-11"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next slide"
            className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center bg-foreground/70 text-background transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-4 sm:size-11"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 sm:bottom-5">
            {items.map((item, position) => (
              <button
                key={`dot-${item.key}`}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Go to slide ${position + 1} of ${count}`}
                aria-current={position === active}
                className={cn(
                  "h-2.5 w-6 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  position === active ? "bg-primary" : "bg-background/60 hover:bg-background",
                )}
              />
            ))}
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            Slide {active + 1} of {count}
          </p>
        </>
      ) : null}
    </div>
  );
}
