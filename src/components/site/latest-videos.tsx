import { SectionHeader, ViewAllSectionLink } from "@/components/site/section-header";
import { StoryCard } from "@/components/story/story-card";
import { t } from "@/lib/i18n";
import type { Story } from "@/lib/stories";

/**
 * The video row: four 16:9 cards on the page background. The play mark is a
 * white circle with the navy glyph and the headline sits under the picture, with
 * the date. Four cards make a row; fewer than four is a stray card, not a shelf.
 */
export function LatestVideos({ stories, title }: { stories: Story[]; title: string }) {
  const cards = stories.slice(0, 4);
  if (cards.length < 4) return null;

  return (
    <section aria-label={title}>
      <SectionHeader
        title={title}
        action={<ViewAllSectionLink slug="videos" label={t.viewAll} />}
      />
      <div className="mt-4 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((story) => (
          <StoryCard key={story.id} story={story} variant="standard" />
        ))}
      </div>
    </section>
  );
}
