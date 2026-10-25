import { Motif } from "@/components/site/motif";
import { Reveal } from "@/components/site/reveal";
import { SectionHeader, ViewAllSectionLink } from "@/components/site/section-header";
import { StoryCard } from "@/components/story/story-card";
import { t } from "@/lib/i18n";
import type { Story } from "@/lib/stories";

/**
 * The video band: the one navy section on the page. Four 16:9 cards across the
 * container, titles laid on the pictures with a white play circle. Nothing is
 * red here and nothing is portrait — the cards match the ratio of the video
 * they stand for.
 */
export function LatestVideos({ stories, title }: { stories: Story[]; title: string }) {
  const cards = stories.slice(0, 4);
  // Four cards make a row; fewer than that is a stray card, not a shelf.
  if (cards.length < 4) return null;

  return (
    <section aria-label={title} className="surface-navy relative text-navy-foreground">
      <Motif />
      <div className="page-shell section-pad relative z-10">
        <SectionHeader
          title={title}
          tone="dark"
          action={<ViewAllSectionLink slug="videos" label={t.viewAll} tone="dark" />}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((story, position) => (
            <Reveal key={story.id} delay={position * 60}>
              <StoryCard story={story} variant="overlay" titleSize="sm" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
