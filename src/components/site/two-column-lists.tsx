import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SectionHeader, ViewAllSectionLink } from "@/components/site/section-header";
import { StoryCard } from "@/components/story/story-card";
import { timeAgo } from "@/lib/format";
import { t } from "@/lib/i18n";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS, URDU_TITLE_CLASS } from "@/lib/story-language";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** An opinion row: the writer's initials, the headline and the byline. */
function OpinionRow({ story }: { story: Story }) {
  const urdu = isUrdu(story.language);

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-blue text-[11px] font-black text-brand-blue-foreground uppercase"
      >
        {initials(story.author) || "GK"}
      </span>
      <div className="min-w-0">
        <Link
          to="/story/$slug"
          params={{ slug: story.slug }}
          {...storyTextAttrs(story.language)}
          className={cn(
            "line-clamp-2 text-sm leading-snug font-bold tracking-tight hover:text-brand-blue",
            urdu && URDU_TITLE_CLASS,
          )}
        >
          {story.title}
        </Link>
        <p
          className={cn(
            "mt-0.5 text-[11px] font-semibold text-muted-foreground",
            urdu && URDU_TEXT_CLASS,
          )}
        >
          {story.author ? <span>{story.author} · </span> : null}
          <time dateTime={story.published_at}>{timeAgo(story.published_at)}</time>
        </p>
      </div>
    </li>
  );
}

function Panel({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="rounded-card border border-border bg-card p-4 shadow-card"
    >
      <SectionHeader title={title} action={<ViewAllSectionLink slug={slug} label={t.viewAll} />} />
      <ul className="mt-2 divide-y divide-border">{children}</ul>
    </section>
  );
}

/**
 * The two lists that close the page: International and Opinion. Each is three
 * rows — International with 88px thumbnails, Opinion with the writer's name and
 * initials beside the headline. A list with nothing in it is not drawn.
 */
export function TwoColumnLists({
  international,
  opinion,
}: {
  international: Story[];
  opinion: Story[];
}) {
  const intl = international.slice(0, 3);
  const op = opinion.slice(0, 3);
  if (intl.length === 0 && op.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {intl.length > 0 ? (
        <Panel title={t.international} slug="world">
          {intl.map((story) => (
            <li key={story.id} className="py-3 first:pt-0 last:pb-0">
              <StoryCard story={story} variant="compact" titleAs="h3" />
            </li>
          ))}
        </Panel>
      ) : null}

      {op.length > 0 ? (
        <Panel title={t.opinion} slug="opinion">
          {op.map((story) => (
            <OpinionRow key={story.id} story={story} />
          ))}
        </Panel>
      ) : null}
    </div>
  );
}
