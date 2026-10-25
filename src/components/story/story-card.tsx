import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { CategoryChip } from "@/components/story/category-chip";
import { timeAgo } from "@/lib/format";
import { t } from "@/lib/i18n";
import { mediaUrl, storyCoverUrl } from "@/lib/media";
import {
  isUrdu,
  storyTextAttrs,
  URDU_DISPLAY_CLASS,
  URDU_TEXT_CLASS,
  URDU_TITLE_CLASS,
} from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

export type StoryCardVariant = "overlay" | "standard" | "large" | "compact";
type TitleTag = "h1" | "h2" | "h3";

/** Every thumbnail is the same frame, filled edge to edge. */
const FRAME_SIZES = "(min-width: 1280px) 33vw, (min-width: 768px) 45vw, 92vw";

function Thumb({
  story,
  eager = false,
  fill = false,
  className,
}: {
  story: Story;
  eager?: boolean;
  /** True when the parent owns the height (overlay cards). */
  fill?: boolean;
  className?: string;
}) {
  const cover = storyCoverUrl(story);
  const thumb = mediaUrl(story.hero_thumb_url);

  return (
    <img
      loading={eager ? "eager" : "lazy"}
      width={1024}
      height={576}
      src={cover}
      srcSet={thumb ? `${thumb} 800w, ${cover} 1600w` : undefined}
      sizes={FRAME_SIZES}
      alt={story.title}
      className={cn(
        "story-image h-full w-full object-cover group-hover:scale-105",
        !fill && "aspect-video",
        className,
      )}
    />
  );
}

/** The green bar that slides in along the bottom edge on hover. */
function GreenBar() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 z-20 h-1 origin-left scale-x-0 bg-green transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 rtl:origin-right motion-reduce:transition-none"
    />
  );
}

/**
 * The play mark: a white circle with the navy glyph, centred on the picture. It
 * grows a little on hover. It is never red — red belongs to the live and
 * breaking marks.
 */
function PlayBadge({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-card text-primary shadow-lift transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none",
        className,
      )}
    >
      <Play className="size-6 fill-current ps-0.5" />
    </span>
  );
}

function Byline({ story, tone = "muted" }: { story: Story; tone?: "muted" | "light" }) {
  const urdu = isUrdu(story.language);
  return (
    <p
      {...storyTextAttrs(story.language)}
      className={cn(
        "flex flex-wrap items-center gap-x-2 text-[11px] font-semibold",
        tone === "light" ? "text-background/75" : "text-muted-foreground",
        urdu && URDU_TEXT_CLASS,
      )}
    >
      <span>{story.category}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={story.published_at}>{timeAgo(story.published_at)}</time>
    </p>
  );
}

/**
 * A story card. The whole card is a link, so an article opens from every surface
 * that lists stories.
 *
 * `overlay` puts the title on the picture and fills whatever height its parent
 * gives it — the video band relies on that. The other variants own a 16:9 frame
 * and put the text underneath.
 */
export function StoryCard({
  story,
  variant = "standard",
  titleAs = "h3",
  titleSize = "md",
  eager = false,
  inverted = false,
  className,
}: {
  story: Story;
  variant?: StoryCardVariant;
  titleAs?: TitleTag;
  /** Only meaningful for `overlay`. */
  titleSize?: "sm" | "md" | "lg";
  eager?: boolean;
  /** True when the card sits on a full colour band, so its text turns light. */
  inverted?: boolean;
  className?: string;
}) {
  const urdu = isUrdu(story.language);
  const textAttrs = storyTextAttrs(story.language);
  const Title = titleAs;
  const titleHover = inverted ? "group-hover:text-background" : "group-hover:text-primary";
  const frame = cn(
    "relative overflow-hidden rounded-card bg-muted shadow-card transition-all duration-300 motion-reduce:transition-none",
    "group-hover:-translate-y-0.5 group-hover:shadow-lift",
  );

  if (variant === "compact") {
    return (
      <Link
        to="/story/$slug"
        params={{ slug: story.slug }}
        className={cn("group grid grid-cols-[8.75rem_minmax(0,1fr)] items-start gap-3", className)}
      >
        <div className={frame}>
          <Thumb story={story} />
        </div>
        <div className="min-w-0" {...textAttrs}>
          <Title
            {...textAttrs}
            className={cn(
              "line-clamp-2 text-[15px] leading-[1.25] font-bold text-balance",
              titleHover,
              urdu && URDU_TITLE_CLASS,
            )}
          >
            {story.title}
          </Title>
          <p
            className={cn(
              "mt-1.5 text-[11px] font-semibold",
              inverted ? "text-background/75" : "text-muted-foreground",
            )}
          >
            <time dateTime={story.published_at}>{timeAgo(story.published_at)}</time>
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "overlay") {
    return (
      <Link
        to="/story/$slug"
        params={{ slug: story.slug }}
        {...textAttrs}
        className={cn(
          "group relative block aspect-video overflow-hidden rounded-card bg-foreground shadow-card transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
          "hover:-translate-y-0.5 hover:shadow-lift",
          className,
        )}
      >
        <Thumb story={story} eager={eager} fill className="opacity-95" />
        <span
          className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/45 to-transparent"
          aria-hidden="true"
        />
        <span className="absolute start-3 top-3 z-10 flex flex-wrap gap-2">
          <CategoryChip label={story.category} tone="light" />
          {story.has_video ? <CategoryChip label={t.video} tone="navy" /> : null}
        </span>
        {story.has_video ? <PlayBadge className="z-10" /> : null}
        <span className="absolute inset-x-0 bottom-0 z-10 grid gap-2 p-4 pb-5 sm:p-5">
          <Title
            {...textAttrs}
            className={cn(
              "font-display font-bold text-background text-balance",
              titleSize === "lg" && "text-2xl leading-[1.15] sm:text-3xl",
              titleSize === "md" && "line-clamp-3 text-lg leading-[1.2]",
              titleSize === "sm" && "line-clamp-2 text-[15px] leading-[1.2]",
              urdu && (titleSize === "lg" ? URDU_DISPLAY_CLASS : URDU_TITLE_CLASS),
            )}
          >
            {story.title}
          </Title>
          <Byline story={story} tone="light" />
        </span>
        <GreenBar />
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
        <Thumb story={story} eager={eager} />
        <span className="absolute start-3 top-3">
          <CategoryChip label={story.category} tone="light" />
        </span>
        {story.has_video ? <PlayBadge /> : null}
        <GreenBar />
      </div>
      <div className="mt-3" {...textAttrs}>
        <Title
          {...textAttrs}
          className={cn(
            "line-clamp-3 font-display leading-[1.2] font-bold text-balance",
            large ? "text-xl sm:text-2xl" : "text-lg",
            titleHover,
            urdu && URDU_TITLE_CLASS,
          )}
        >
          {story.title}
        </Title>
        {large ? (
          <p
            {...textAttrs}
            className={cn(
              "mt-2 line-clamp-2 text-sm leading-relaxed",
              inverted ? "text-background/80" : "text-muted-foreground",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            {story.summary}
          </p>
        ) : null}
        <div className="mt-2">
          <Byline story={story} tone={inverted ? "light" : "muted"} />
        </div>
      </div>
    </Link>
  );
}
