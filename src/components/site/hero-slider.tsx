import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { CategoryChip } from "@/components/story/category-chip";
import { timeAgo } from "@/lib/format";
import { t } from "@/lib/i18n";
import { mediaUrl, storyCoverUrl } from "@/lib/media";
import { isUrdu, storyTextAttrs, URDU_DISPLAY_CLASS, URDU_TITLE_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/** One rotation, in ms. */
const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD_PX = 45;
/** The lead plus the four that follow it in the rail. */
const MAX_SLIDES = 5;

type Slide = {
  key: string;
  src: string;
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  hasVideo: boolean;
  language: Story["language"];
};

function toSlides(stories: Story[]): Slide[] {
  const slides: Slide[] = [];
  for (const story of stories) {
    const src = storyCoverUrl(story);
    if (!src) continue;
    slides.push({
      key: story.id,
      src: mediaUrl(story.hero_thumb_url) ?? src,
      slug: story.slug,
      title: story.title,
      category: story.category,
      publishedAt: story.published_at,
      hasVideo: story.has_video,
      language: story.language,
    });
    if (slides.length >= MAX_SLIDES) break;
  }
  return slides;
}

/**
 * The hero gallery. Pictures crossfade rather than slide, so the frame never
 * jumps. The copy block lines up with the page container, the gradient covers
 * only the bottom half so the photograph stays bright, and the rail below lists
 * every frame as one of five equal columns.
 *
 * It advances on its own and can be driven with the rail, a swipe or the
 * left/right keys. It holds still while hovered or focused, and never rotates
 * for readers who ask for reduced motion.
 */
export function HeroSlider({ stories, className }: { stories: Story[]; className?: string }) {
  const items = useMemo(() => toSlides(stories), [stories]);
  const count = items.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // A stale index after the list shrinks would blank the frame.
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
      aria-label="Top stories"
      className={cn(
        "grid h-full w-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-foreground",
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
      <div className="relative overflow-hidden">
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
              <Link
                to="/story/$slug"
                params={{ slug: item.slug }}
                tabIndex={isActive ? 0 : -1}
                className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-sky"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  loading={position === 0 ? "eager" : "lazy"}
                  fetchPriority={position === 0 ? "high" : "auto"}
                  className="h-full w-full object-cover"
                />
                {/* The scrim covers only the bottom 55%, so the picture reads bright. */}
                <span
                  className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-0 bottom-0">
                  <span className="page-shell block">
                    <span className="grid max-w-[46rem] gap-3">
                      <span className="flex flex-wrap items-center gap-3">
                        {item.category ? <CategoryChip label={item.category} tone="green" /> : null}
                        {item.hasVideo ? <CategoryChip label={t.video} tone="navy" /> : null}
                        <span className="text-[11px] font-bold tracking-[0.12em] text-background/80 uppercase">
                          <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time>
                        </span>
                      </span>
                      <span
                        {...textAttrs}
                        className={cn(
                          "line-clamp-3 font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.05] font-bold text-background text-balance",
                          urdu && URDU_DISPLAY_CLASS,
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="mt-1 inline-flex w-fit items-center gap-2 bg-green px-5 py-3 text-[11px] font-black tracking-[0.14em] text-green-foreground uppercase">
                        {item.hasVideo ? (
                          <Play className="size-3.5 fill-current" aria-hidden="true" />
                        ) : null}
                        {item.hasVideo ? t.watch : t.read}
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            </div>
          );
        })}

        {/* Only shown where the gutter is wide enough to clear the copy. */}
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous story"
              className="absolute top-1/2 left-6 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-foreground/55 text-background backdrop-blur transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky lg:grid"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next story"
              className="absolute top-1/2 right-6 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-foreground/55 text-background backdrop-blur transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky lg:grid"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="relative z-10 bg-navy-deep/85 backdrop-blur">
          <ul className="page-shell grid grid-cols-5 gap-2 py-3 sm:gap-3">
            {items.map((item, position) => {
              const isActive = position === active;
              return (
                <li key={item.key} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setIndex(position)}
                    aria-label={item.title}
                    aria-current={isActive}
                    className={cn(
                      "group block w-full text-start transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
                      isActive ? "opacity-100" : "opacity-70 hover:opacity-100",
                    )}
                  >
                    <span className="relative block aspect-video overflow-hidden rounded-sm bg-foreground/40">
                      <img
                        src={item.src}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <span
                        className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent"
                        aria-hidden="true"
                      />
                      {isActive ? (
                        <span
                          className="absolute inset-x-0 top-0 z-10 h-1 bg-green"
                          aria-hidden="true"
                        />
                      ) : null}
                    </span>
                    <span
                      {...storyTextAttrs(item.language)}
                      className={cn(
                        "mt-1.5 line-clamp-2 block text-[10px] leading-[1.3] font-bold text-background/90 sm:text-[12px]",
                        isUrdu(item.language) && URDU_TITLE_CLASS,
                      )}
                    >
                      {item.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p role="status" aria-live="polite" className="sr-only">
            Story {active + 1} of {count}
          </p>
        </div>
      ) : null}
    </div>
  );
}
