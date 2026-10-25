import { Link } from "@tanstack/react-router";
import { CategoryChip } from "@/components/story/category-chip";
import { StoryThumb } from "@/components/story/story-thumb";
import { t } from "@/lib/i18n";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS, URDU_TITLE_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * The Editor's Pick panel: the one featured story, on the pale blue surface with
 * a big picture, its standfirst and a route to read it. It is drawn only when
 * the desk has flagged a story, so it needs no empty state.
 */
export function EditorsPick({ story }: { story: Story | null }) {
  if (!story) return null;
  const urdu = isUrdu(story.language);

  return (
    <Link
      to="/story/$slug"
      params={{ slug: story.slug }}
      {...storyTextAttrs(story.language)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-tint p-4 shadow-card transition-all duration-300 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="text-[10px] font-black tracking-[0.16em] text-navy uppercase">
        {t.editorsPick}
      </span>
      <div className="relative mt-3 aspect-video overflow-hidden rounded-card bg-muted shadow-card">
        <StoryThumb story={story} />
        {story.category ? (
          <span className="absolute start-2 top-2 z-10">
            <CategoryChip label={story.category} />
          </span>
        ) : null}
      </div>
      <h3
        className={cn(
          "mt-3 line-clamp-3 text-lg leading-[1.25] font-bold tracking-tight text-balance group-hover:text-brand-blue",
          urdu && URDU_TITLE_CLASS,
        )}
      >
        {story.title}
      </h3>
      {story.summary ? (
        <p
          className={cn(
            "mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground",
            urdu && URDU_TEXT_CLASS,
          )}
        >
          {story.summary}
        </p>
      ) : null}
      <span className="mt-4 inline-flex w-fit items-center bg-brand-blue px-4 py-2.5 text-[11px] font-black tracking-[0.1em] text-brand-blue-foreground uppercase transition-colors group-hover:bg-navy">
        {t.readMore}
      </span>
    </Link>
  );
}
