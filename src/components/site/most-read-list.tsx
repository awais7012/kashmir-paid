import { Link } from "@tanstack/react-router";
import { timeAgo } from "@/lib/format";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS, URDU_TITLE_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * A numbered ranking list. The API counts no views, so this is ordered by how
 * the desk marked each story (featured, then display order, then recency) —
 * prominence, honestly labelled, rather than a real read count.
 */
export function MostReadList({ stories, title }: { stories: Story[]; title: string }) {
  if (stories.length === 0) return null;

  return (
    <section aria-label={title} className="border border-border bg-card shadow-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-lg font-black">{title}</h2>
      <ol>
        {stories.map((story, index) => {
          const urdu = isUrdu(story.language);
          return (
            <li key={story.id} className="border-b border-border last:border-b-0">
              <Link
                to="/story/$slug"
                params={{ slug: story.slug }}
                className="group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
              >
                <span
                  className="font-display text-2xl leading-none font-black text-green"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    {...storyTextAttrs(story.language)}
                    className={cn(
                      "block text-sm leading-snug font-bold text-balance group-hover:text-primary",
                      urdu && URDU_TITLE_CLASS,
                    )}
                  >
                    {story.title}
                  </span>
                  <span
                    {...storyTextAttrs(story.language)}
                    className={cn(
                      "mt-1 block text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase",
                      urdu && URDU_TEXT_CLASS,
                    )}
                  >
                    <time dateTime={story.published_at}>{timeAgo(story.published_at)}</time>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
