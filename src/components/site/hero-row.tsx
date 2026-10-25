import { HeroSlider } from "@/components/site/hero-slider";
import { LatestNewsCard } from "@/components/site/latest-news-card";
import { t } from "@/lib/i18n";
import type { Story } from "@/lib/stories";

/**
 * The hero row: the top-story slider across two thirds, the "Latest news" card
 * beside it. Both cells stretch, so the card stands exactly as tall as the
 * slider. Either half hides itself when it has nothing to show.
 */
export function HeroRow({ hero, latest }: { hero: Story[]; latest: Story[] }) {
  if (hero.length === 0 && latest.length === 0) return null;

  return (
    <section aria-label={t.topStories} className="grid items-stretch gap-4 lg:grid-cols-3">
      {hero.length > 0 ? (
        <div className="lg:col-span-2">
          <HeroSlider stories={hero} />
        </div>
      ) : null}
      {latest.length > 0 ? (
        <div className="min-h-0 lg:col-span-1">
          <LatestNewsCard stories={latest} />
        </div>
      ) : null}
    </section>
  );
}
