import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StoryCard } from "@/components/story/story-card";
import { publicStories } from "@/lib/home-feed";
import { t } from "@/lib/i18n";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { allStoriesQueryOptions, primeQuery } from "@/lib/stories";

export const Route = createFileRoute("/news")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
    await primeQuery(context.queryClient, allStoriesQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "News · Global Kashmir TV" },
      {
        name: "description",
        content: "Every published story from Global Kashmir TV, newest first.",
      },
    ],
  }),
  component: NewsIndex,
});

function NewsIndex() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  const { data: page } = useQuery(allStoriesQueryOptions);

  if (!settings || !page) return <PageShimmer />;

  // The index lists one language: the one this deployment publishes in.
  const stories = publicStories(page.data);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="page-shell py-8 lg:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-brand-blue uppercase">
              The desk
            </p>
            <h1 className="mt-1 text-[clamp(1.75rem,5vw,2.75rem)] leading-tight font-extrabold tracking-tight">
              News
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {stories.length} {stories.length === 1 ? t.story : t.stories}
          </p>
        </div>

        <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} variant="large" />
          ))}
        </div>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
