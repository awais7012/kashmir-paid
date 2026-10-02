import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { storyCoverUrl } from "@/lib/media";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * A story card. The whole card is a real link, so clicking an article works
 * from every surface that lists stories.
 */
export function StoryCard({ story, large = false }: { story: Story; large?: boolean }) {
  const urdu = isUrdu(story.language);
  const textAttrs = storyTextAttrs(story.language);

  return (
    <Link
      to="/story/$slug"
      params={{ slug: story.slug }}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <div
        className={`relative overflow-hidden bg-muted ${large ? "aspect-[16/10]" : "aspect-[4/3]"}`}
      >
        <img
          loading="lazy"
          width={1024}
          height={768}
          src={storyCoverUrl(story)}
          alt={story.title}
          className="story-image h-full w-full object-cover grayscale-[18%] group-hover:scale-[1.025] group-hover:grayscale-0"
        />
        {story.has_video ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-primary px-2 py-1 text-[9px] font-black tracking-[0.14em] text-primary-foreground uppercase">
            <Play className="size-3 fill-current" />
            Video
          </span>
        ) : null}
      </div>
      <p
        {...textAttrs}
        className={cn(
          "mt-3 text-[10px] font-black tracking-[0.16em] text-primary uppercase",
          urdu && URDU_TEXT_CLASS,
        )}
      >
        {story.category} · {timeAgo(story.published_at)}
      </p>
      <h3
        {...textAttrs}
        className={cn(
          "mt-2 font-display leading-[1.02] font-bold decoration-primary decoration-2 underline-offset-4 group-hover:underline",
          large ? "text-3xl sm:text-4xl" : "text-2xl",
          urdu && URDU_TEXT_CLASS,
        )}
      >
        {story.title}
      </h3>
      {large ? (
        <p
          {...textAttrs}
          className={cn(
            "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base",
            urdu && URDU_TEXT_CLASS,
          )}
        >
          {story.summary}
        </p>
      ) : null}
    </Link>
  );
}
