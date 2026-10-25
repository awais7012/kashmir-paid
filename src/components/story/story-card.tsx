import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { CategoryChip } from "@/components/story/category-chip";
import { StoryThumb } from "@/components/story/story-thumb";
import { timeAgo } from "@/lib/format";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS, URDU_TITLE_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

export type StoryCardVariant = "standard" | "large" | "compact";
type TitleTag = "h1" | "h2" | "h3" | "h4";

/**
 * The play mark: a white circle with the navy glyph, centred on the picture. It
 * is never red — red belongs to the live and breaking marks.
 */
function PlayBadge() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 z-10 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-card text-primary shadow-lift transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
    >
      <Play className="size-5 fill-current ps-0.5" />
    </span>
  );
}

/** The date, under the headline, in muted text. */
function DateLine({ story, className }: { story: Story; className?: string }) {
  return (
    <time
      dateTime={story.published_at}
      className={cn(
        "block text-[11px] font-semibold text-muted-foreground",
        isUrdu(story.language) && URDU_TEXT_CLASS,
        className,
      )}
    >
      {timeAgo(story.published_at)}
    </time>
  );
}

/**
 * One story, as a card. The whole card is a link.
 *
 * `standard` and `large` own a 16:9 frame with the text underneath; `compact`
 * is a list row with an 88px thumbnail. Titles are bold sans so a dense page
 * stays legible; Urdu card titles take Naskh with generous leading.
 */
export function StoryCard({
  story,
  variant = "standard",
  titleAs = "h3",
  eager = false,
  showCategory = false,
  className,
}: {
  story: Story;
  variant?: StoryCardVariant;
  titleAs?: TitleTag;
  eager?: boolean;
  /** Show the category chip on a compact row (the chip is always on the frame otherwise). */
  showCategory?: boolean;
  className?: string;
}) {
  const urdu = isUrdu(story.language);
  const textAttrs = storyTextAttrs(story.language);
  const Title = titleAs;
  const frame =
    "relative aspect-video overflow-hidden rounded-card bg-muted shadow-card transition-all duration-300 motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:shadow-lift";
  const titleClass = "line-clamp-3 text-[15px] leading-[1.3] font-bold tracking-tight";

  if (variant === "compact") {
    return (
      <Link
        to="/story/$slug"
        params={{ slug: story.slug }}
        {...textAttrs}
        className={cn("group grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3", className)}
      >
        <div className={frame}>
          <StoryThumb story={story} />
        </div>
        <div className="min-w-0">
          <Title
            className={cn(
              "line-clamp-2 text-[14px] leading-[1.3] font-bold tracking-tight text-balance group-hover:text-brand-blue",
              urdu && URDU_TITLE_CLASS,
            )}
          >
            {story.title}
          </Title>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {showCategory && story.category ? <CategoryChip label={story.category} /> : null}
            <DateLine story={story} />
          </div>
        </div>
      </Link>
    );
  }

  const large = variant === "large";

  return (
    <Link
      to="/story/$slug"
      params={{ slug: story.slug }}
      className={cn(
        "group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <div className={frame}>
        <StoryThumb story={story} eager={eager} />
        {story.category ? (
          <span className="absolute start-2 top-2 z-10">
            <CategoryChip label={story.category} />
          </span>
        ) : null}
        {story.has_video ? <PlayBadge /> : null}
      </div>
      <div className="mt-3" {...textAttrs}>
        <Title
          className={cn(
            titleClass,
            "text-balance group-hover:text-brand-blue",
            urdu && URDU_TITLE_CLASS,
          )}
        >
          {story.title}
        </Title>
        {large ? (
          <p
            className={cn(
              "mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            {story.summary}
          </p>
        ) : null}
        <DateLine story={story} className="mt-2" />
      </div>
    </Link>
  );
}
