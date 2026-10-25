import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CategoryBlocks } from "@/components/site/category-block";
import { CategoryTiles } from "@/components/site/category-tiles";
import { HeroRow } from "@/components/site/hero-row";
import { HomeSkeleton } from "@/components/site/home-skeleton";
import { LatestVideos } from "@/components/site/latest-videos";
import { LiveCard } from "@/components/site/live-card";
import { PromoStrip } from "@/components/site/promo-strip";
import { ScheduleCard } from "@/components/site/schedule-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TopStories } from "@/components/site/top-stories";
import { TwoColumnLists } from "@/components/site/two-column-lists";
import { selectHomeFeed } from "@/lib/home-feed";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { primeQuery, storiesQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
    const stories = await primeQuery(context.queryClient, storiesQueryOptions);
    // The hero picture is the page's LCP element, so it is discovered here and
    // preloaded in the head rather than waiting for the markup to be parsed.
    const feed = stories ? selectHomeFeed(stories) : null;
    const hero = feed?.hero[0] ?? feed?.pick ?? null;
    return { preloadImage: hero ? mediaUrl(hero.hero_image_url) : null };
  },
  head: ({ loaderData }) => ({
    links: loaderData?.preloadImage
      ? [{ rel: "preload", as: "image", href: loaderData.preloadImage }]
      : [],
    meta: [
      { title: "Global Kashmir TV — Kashmir, Connected to the World" },
      {
        name: "description",
        content:
          "Live news, stories, heritage, people, tourism and sport from Kashmir and across the world.",
      },
      { property: "og:title", content: "Global Kashmir TV — Kashmir, Connected to the World" },
      { property: "og:description", content: "See Kashmir. Hear Kashmir. Understand Kashmir." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Global Kashmir TV" },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Global Kashmir TV" },
      { name: "twitter:description", content: "See Kashmir. Hear Kashmir. Understand Kashmir." },
    ],
  }),
  component: Index,
});

/**
 * The homepage. Every module hides itself when it has nothing to show, so the
 * page closes up rather than leaving a gap. The vertical rhythm between modules
 * is one 24px gap.
 */
function Index() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  const { data: stories } = useQuery(storiesQueryOptions);

  if (!settings || !stories) return <HomeSkeleton />;

  const feed = selectHomeFeed(stories);
  const { live } = settings;

  const showTiles = feed.categories.length >= 4;
  const showLive = live.title.trim() !== "" || live.streamUrl.trim() !== "" || Boolean(live.video);
  const showVideos = feed.videos.length >= 4;

  const hasAnything =
    feed.hero.length > 0 ||
    feed.latestNews.length > 0 ||
    feed.categories.length > 0 ||
    feed.topStories.length > 0 ||
    feed.videos.length > 0 ||
    Boolean(feed.pick);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />
      {/* keyboard readers land here before the masthead's many links */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[60] focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-navy-foreground"
      >
        {t.skipToContent}
      </a>

      <main id="main" className="page-shell grid gap-6 py-6">
        {!hasAnything ? (
          <section className="rounded-card border border-border bg-card p-6 shadow-card">
            <h1 className="text-2xl font-extrabold tracking-tight">{t.noStories}</h1>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {t.noStoriesBody}
            </p>
          </section>
        ) : null}

        {feed.hero.length > 0 || feed.latestNews.length > 0 ? (
          <HeroRow hero={feed.hero} latest={feed.latestNews} />
        ) : null}

        {showTiles || showLive ? (
          <div className={cn("grid gap-6", showTiles && showLive && "lg:grid-cols-3")}>
            {showTiles ? (
              <div className={cn(showLive && "lg:col-span-2")}>
                <CategoryTiles categories={feed.categories} layout={showLive ? "split" : "wide"} />
              </div>
            ) : null}
            {showLive ? <LiveCard live={live} className={cn(!showTiles && "lg:max-w-sm")} /> : null}
          </div>
        ) : null}

        {feed.categories.length > 0 ? <CategoryBlocks categories={feed.categories} /> : null}

        {feed.topStories.length > 0 || feed.pick ? (
          <TopStories stories={feed.topStories} pick={feed.pick} />
        ) : null}

        {showVideos ? <LatestVideos stories={feed.videos} title={t.latestVideos} /> : null}

        <ScheduleCard settings={settings} />

        <PromoStrip settings={settings} />

        <TwoColumnLists international={feed.international} opinion={feed.opinion} />
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
