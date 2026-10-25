import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { looksUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * The breaking strip. A solid red label block sits on the left, the headlines
 * travel through a clipping window beside it, and prev/next arrows step the
 * run. The text can never be painted over the label — it slides out from behind
 * the label's edge and leaves at the far side.
 *
 * The arrows re-seed the run (the marquee restarts from the new first story),
 * and under `prefers-reduced-motion` the strip holds still while the arrows keep
 * working.
 */
export function BreakingStrip({ stories, label }: { stories: Story[]; label?: string }) {
  const [offset, setOffset] = useState(0);
  if (stories.length === 0) return null;

  const heading = label?.trim() || t.breaking;
  const count = stories.length;
  const rotated = [...stories.slice(offset), ...stories.slice(0, offset)];
  const loop = [...rotated, ...rotated];

  const step = (delta: number) => setOffset((current) => (current + delta + count) % count);

  return (
    <div className="flex min-w-0 flex-1 items-stretch bg-live">
      <span
        className={cn(
          "relative z-20 flex shrink-0 items-center gap-2 bg-live px-2.5 py-1.5 text-[10px] font-black tracking-[0.16em] text-live-foreground uppercase sm:px-3",
          looksUrdu(heading) && URDU_TEXT_CLASS,
        )}
      >
        <span
          className="signal-pulse size-1.5 rounded-full bg-live-foreground"
          aria-hidden="true"
        />
        {heading}
      </span>

      {/* The window the headlines are clipped to. */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          key={offset}
          className="marquee-ltr flex w-max min-w-max items-center whitespace-nowrap hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
        >
          {loop.map((story, index) => (
            <Link
              key={`${story.id}-${index}`}
              to="/story/$slug"
              params={{ slug: story.slug }}
              {...storyTextAttrs(story.language)}
              className={cn(
                "px-4 text-xs font-bold text-live-foreground/95 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-6",
                looksUrdu(story.title) && URDU_TEXT_CLASS,
              )}
            >
              {story.title}
              <span className="ms-4 text-live-foreground/60 sm:ms-6" aria-hidden="true">
                ◆
              </span>
            </Link>
          ))}
        </div>
      </div>

      {count > 1 ? (
        <div className="z-20 flex shrink-0 items-stretch border-s border-live-foreground/25">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous headline"
            className="grid w-8 place-items-center text-live-foreground transition-colors hover:bg-live-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next headline"
            className="grid w-8 place-items-center border-s border-live-foreground/25 text-live-foreground transition-colors hover:bg-live-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
          >
            <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
