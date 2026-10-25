import { SectionHeader, ViewAllLink } from "@/components/site/section-header";
import { EditorsPick } from "@/components/site/editors-pick";
import { StoryCard } from "@/components/story/story-card";
import { t } from "@/lib/i18n";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * The Top stories row: four cards, beside the Editor's Pick panel when the desk
 * has flagged a story. Without a pick the four cards simply take the full width,
 * so the row never leaves an empty half.
 */
export function TopStories({ stories, pick }: { stories: Story[]; pick: Story | null }) {
  const cards = stories.slice(0, 4);
  if (cards.length === 0 && !pick) return null;

  return (
    <section aria-label={t.topStories}>
      <SectionHeader title={t.topStories} action={<ViewAllLink to="/news" label={t.viewAll} />} />

      <div className={cn("mt-4 grid items-stretch gap-6", pick ? "lg:grid-cols-5" : undefined)}>
        {cards.length > 0 ? (
          <div
            className={cn(
              "grid gap-x-6 gap-y-6",
              pick ? "grid-cols-2 lg:col-span-3" : "grid-cols-2 lg:grid-cols-4",
            )}
          >
            {cards.map((story) => (
              <StoryCard key={story.id} story={story} variant="standard" />
            ))}
          </div>
        ) : null}

        {pick ? (
          <div className="lg:col-span-2">
            <EditorsPick story={pick} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
