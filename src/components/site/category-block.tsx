import { Link } from "@tanstack/react-router";
import { CategoryChip } from "@/components/story/category-chip";
import { StoryCard } from "@/components/story/story-card";
import { StoryThumb } from "@/components/story/story-thumb";
import { SectionHeader, ViewAllSectionLink } from "@/components/site/section-header";
import { timeAgo } from "@/lib/format";
import type { CategorySection } from "@/lib/home-feed";
import { t } from "@/lib/i18n";
import { slugifyLabel } from "@/lib/site-settings";
import { isUrdu, storyTextAttrs, URDU_TITLE_CLASS } from "@/lib/story-language";
import { cn } from "@/lib/utils";

/**
 * One category column: the section title with its blue underline and a route to
 * the full section, one 16:9 lead card with its summary, and up to three compact
 * rows underneath. Every column is the same shape, so a row of four reads as a
 * single band.
 */
function Block({ section }: { section: CategorySection }) {
  const [lead, ...rest] = section.stories;
  if (!lead) return null;
  const rows = rest.slice(0, 3);
  const urdu = isUrdu(lead.language);

  return (
    <section className="flex h-full flex-col" aria-label={section.label}>
      <SectionHeader
        title={section.label}
        action={<ViewAllSectionLink slug={slugifyLabel(section.label)} label={t.viewAll} />}
      />

      <Link
        to="/story/$slug"
        params={{ slug: lead.slug }}
        {...storyTextAttrs(lead.language)}
        className="group mt-3 block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="relative aspect-video overflow-hidden rounded-card bg-muted shadow-card transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lift motion-reduce:transition-none">
          <StoryThumb story={lead} />
          {lead.category ? (
            <span className="absolute start-2 top-2 z-10">
              <CategoryChip label={lead.category} />
            </span>
          ) : null}
        </div>
        <h3
          className={cn(
            "mt-2.5 line-clamp-3 text-[15px] leading-[1.3] font-bold tracking-tight text-balance group-hover:text-brand-blue",
            urdu && URDU_TITLE_CLASS,
          )}
        >
          {lead.title}
        </h3>
        {lead.summary ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {lead.summary}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <time
            dateTime={lead.published_at}
            className="text-[11px] font-semibold text-muted-foreground"
          >
            {timeAgo(lead.published_at)}
          </time>
          <span className="text-[11px] font-black tracking-[0.08em] text-brand-blue uppercase">
            {t.readMore}
          </span>
        </div>
      </Link>

      {rows.length > 0 ? (
        <ul className="mt-4 grid flex-1 content-start gap-3 border-t border-border pt-4">
          {rows.map((story) => (
            <li key={story.id}>
              <StoryCard story={story} variant="compact" titleAs="h4" />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/**
 * The category blocks: up to four sections side by side, four across on desktop,
 * two on tablet and one on a phone.
 */
export function CategoryBlocks({ categories }: { categories: CategorySection[] }) {
  const blocks = categories.slice(0, 4);
  if (blocks.length === 0) return null;

  return (
    <div className="grid items-stretch gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {blocks.map((section) => (
        <Block key={section.key} section={section} />
      ))}
    </div>
  );
}
