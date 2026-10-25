import { StoryCard } from "@/components/story/story-card";
import { t } from "@/lib/i18n";
import type { Story } from "@/lib/stories";

/**
 * The "Latest news" card beside the hero: up to five recent stories with an 88px
 * thumbnail, a two-line title and the date under it. It is a white card that
 * fills its grid cell, so it stands exactly as tall as the hero next to it.
 */
export function LatestNewsCard({ stories }: { stories: Story[] }) {
  const rows = stories.slice(0, 5);
  if (rows.length === 0) return null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-border bg-card shadow-card">
      <h2 className="shrink-0 border-b border-border px-4 py-3 text-sm font-extrabold tracking-tight uppercase">
        {t.latestNews}
      </h2>
      <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border">
        {rows.map((story) => (
          <li key={story.id} className="flex min-h-0 flex-1 items-center px-4 py-2">
            <StoryCard
              story={story}
              variant="compact"
              showCategory
              className="h-full w-full items-center"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
