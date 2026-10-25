import { Link } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { looksUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * The breaking strip.
 *
 * The label is its own solid block and the headlines travel through a clipping
 * window beside it, so the text can never be painted over the label — it slides
 * out from behind the label's edge and leaves at the far side.
 */
export function BreakingTicker({ stories, label }: { stories: Story[]; label?: string }) {
  if (stories.length === 0) return null;

  const heading = label?.trim() || t.breaking;
  const loop = [...stories, ...stories];

  return (
    <div className="flex min-w-0 flex-1 items-stretch">
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
        <div className="marquee-ltr flex w-max min-w-max items-center whitespace-nowrap hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
          {loop.map((story, index) => (
            <Link
              key={`${story.id}-${index}`}
              to="/story/$slug"
              params={{ slug: story.slug }}
              {...storyTextAttrs(story.language)}
              className={cn(
                "px-4 text-xs font-bold text-navy-foreground/90 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky sm:px-6",
                looksUrdu(story.title) && URDU_TEXT_CLASS,
              )}
            >
              {story.title}
              <span className="ms-4 text-sky/60 sm:ms-6" aria-hidden="true">
                ◆
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
