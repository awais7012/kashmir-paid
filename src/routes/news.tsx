import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StoryCard } from "@/components/story/story-card";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { allStoriesQueryOptions } from "@/lib/stories";

export const Route = createFileRoute("/news")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(siteSettingsQueryOptions);
    await context.queryClient.ensureQueryData(allStoriesQueryOptions);
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
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: page } = useSuspenseQuery(allStoriesQueryOptions);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              The desk
            </p>
            <h1 className="mt-1 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] font-black">
              News
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {page.meta.total} {page.meta.total === 1 ? "story" : "stories"}
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {page.data.map((story) => (
            <StoryCard key={story.id} story={story} large />
          ))}
        </div>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
