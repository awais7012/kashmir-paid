import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { CategoryBlock, type BlockTone } from "@/components/site/category-block";
import { Hero } from "@/components/site/hero";
import { HomeSkeleton } from "@/components/site/home-skeleton";
import { LatestVideos } from "@/components/site/latest-videos";
import { LiveStrip } from "@/components/site/live-strip";
import { Motif } from "@/components/site/motif";
import { MostReadList } from "@/components/site/most-read-list";
import { Reveal } from "@/components/site/reveal";
import { SectionHeader, ViewAllLink, ViewAllSectionLink } from "@/components/site/section-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SocialFollow } from "@/components/site/social-follow";
import { SubscribeBanner } from "@/components/site/subscribe-banner";
import { StoryCard } from "@/components/story/story-card";
import { selectHomeFeed } from "@/lib/home-feed";
import { categoryTitles, t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { socialLinks } from "@/lib/social";
import { primeQuery, storiesQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
    await primeQuery(context.queryClient, storiesQueryOptions);
  },
  head: () => ({
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
 * A full-width band. Only two carry colour — the navy video band and the green
 * category band. Every other section is white or off-white, alternating.
 */
type BandTone = "white" | "offwhite" | "green";

const BAND_BG: Record<BandTone, string> = {
  white: "bg-card",
  offwhite: "bg-background",
  green: "relative bg-green text-green-foreground",
};

function Band({ children, tone = "white" }: { children: ReactNode; tone?: BandTone }) {
  return (
    <div className={BAND_BG[tone]}>
      {tone === "green" ? <Motif /> : null}
      <div className={cn("page-shell section-pad", tone === "green" && "relative z-10")}>
        {children}
      </div>
    </div>
  );
}

/** Each section keeps the same shape; only the accent colour differs. */
const CATEGORY_STYLE: Record<string, { tone: BlockTone; band: BandTone; inverted?: boolean }> = {
  kashmir: { tone: "navy", band: "offwhite" },
  pakistan: { tone: "green", band: "green", inverted: true },
  world: { tone: "sky", band: "white" },
  library: { tone: "sky", band: "offwhite" },
};

/** The programmes row needs a few cards before it is worth drawing. */
const MIN_PROGRAMS = 3;

function Index() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  const { data: stories } = useQuery(storiesQueryOptions);

  if (!settings || !stories) return <HomeSkeleton />;

  const feed = selectHomeFeed(stories);
  const social = socialLinks(settings);
  const scheduleImage = mediaUrl(settings.schedule.image);

  // Store links are optional and unset today, so this list is empty and the
  // block does not appear.
  const appLinks: { href: string; label: string }[] = [];
  if (settings.apps?.ios) appLinks.push({ href: settings.apps.ios, label: "App Store" });
  if (settings.apps?.android) appLinks.push({ href: settings.apps.android, label: "Google Play" });

  // The hero rotator takes the lead and the four beside it.
  const heroStories = feed.lead ? [feed.lead, ...feed.heroSidebar] : [];

  const showVideos = feed.videos.length >= 4;
  const showPrograms = feed.programs.length >= MIN_PROGRAMS;
  const showLatest = feed.latest.length > 0;
  const hasSidebar =
    feed.mostRead.length > 0 ||
    settings.social.youtube.trim() !== "" ||
    social.length > 0 ||
    appLinks.length > 0;

  /*
   * The latest grid never leaves an orphan cell. Six divides by both two and
   * three, so six cards fill the row at every breakpoint; a shorter list is laid
   * out for the columns it can actually complete.
   */
  const latestAll = feed.latest;
  const latest = latestAll.length >= 6 ? latestAll.slice(0, 6) : latestAll;
  const latestCols =
    latest.length >= 6
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : latest.length === 3
        ? "lg:grid-cols-3"
        : "sm:grid-cols-2";
  const latestSpanFirst = latest.length === 5;

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

      <main id="main">
        {feed.lead ? (
          <>
            {/* The hero runs edge to edge, so it is not wrapped in a Band. */}
            <Hero stories={heroStories} />

            <LiveStrip live={settings.live} />

            {showVideos ? <LatestVideos stories={feed.videos} title={t.latestVideos} /> : null}

            {feed.categories.map((section) => {
              const style = CATEGORY_STYLE[section.key];
              return (
                <Band key={section.key} tone={style?.band ?? "offwhite"}>
                  <Reveal>
                    <CategoryBlock
                      id={section.key}
                      title={
                        categoryTitles[section.key as keyof typeof categoryTitles] ?? section.key
                      }
                      stories={section.stories}
                      tone={style?.tone ?? "navy"}
                      inverted={style?.inverted ?? false}
                    />
                  </Reveal>
                </Band>
              );
            })}

            {showPrograms ? (
              <Band tone="white">
                <SectionHeader
                  title={t.programs}
                  action={<ViewAllSectionLink slug="shows" label={t.viewAll} />}
                />
                <Reveal>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {feed.programs.slice(0, 4).map((story) => (
                      <StoryCard key={story.id} story={story} variant="standard" />
                    ))}
                  </div>
                </Reveal>
              </Band>
            ) : null}

            {showLatest || hasSidebar ? (
              <Band tone="white">
                <div
                  className={cn(
                    "grid gap-10",
                    showLatest && hasSidebar && "lg:grid-cols-[minmax(0,1fr)_20rem]",
                  )}
                >
                  {showLatest ? (
                    <div className="min-w-0">
                      <SectionHeader
                        title={t.latestStories}
                        action={<ViewAllLink to="/news" label={t.viewAll} />}
                      />
                      <div className={cn("mt-6 grid gap-x-6 gap-y-8", latestCols)}>
                        {latest.map((story, position) => (
                          <Reveal
                            key={story.id}
                            delay={position * 60}
                            className={cn(position === 0 && latestSpanFirst && "sm:col-span-2")}
                          >
                            <StoryCard
                              story={story}
                              variant={position === 0 && latestSpanFirst ? "large" : "standard"}
                            />
                          </Reveal>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {hasSidebar ? (
                    <aside className="grid content-start gap-5">
                      <MostReadList stories={feed.mostRead} title={t.mostRead} />
                      <SubscribeBanner href={settings.social.youtube} />
                      <SocialFollow social={social} title={t.followUs} />
                      {appLinks.length > 0 ? (
                        <section
                          aria-label="Global Kashmir TV apps"
                          className="rounded-card border border-border bg-card p-5 shadow-card"
                        >
                          <h2 className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase">
                            <Download className="size-4" aria-hidden="true" />
                            Apps
                          </h2>
                          <ul className="mt-4 grid gap-2">
                            {appLinks.map((app) => (
                              <li key={app.label}>
                                <a
                                  href={app.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-sm border border-border px-3 py-2.5 text-xs font-bold transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                >
                                  {app.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                    </aside>
                  ) : null}
                </div>
              </Band>
            ) : null}

            {feed.opinion.length > 0 ? (
              <Band tone="offwhite">
                <SectionHeader
                  title={t.opinion}
                  action={<ViewAllLink to="/news" label={t.viewAll} />}
                />
                {/* Columns follow the number of cards. A single opinion piece
                    becomes one wide card rather than a card floating in an
                    otherwise empty band. */}
                <div
                  className={cn(
                    "mt-6 grid gap-x-6 gap-y-8",
                    feed.opinion.length > 1 && "sm:grid-cols-2",
                    feed.opinion.length > 2 && "lg:grid-cols-3",
                  )}
                >
                  {feed.opinion.slice(0, 3).map((story, position) => (
                    <Reveal key={story.id} delay={position * 60}>
                      <StoryCard
                        story={story}
                        variant={feed.opinion.length === 1 ? "large" : "standard"}
                      />
                    </Reveal>
                  ))}
                </div>
              </Band>
            ) : null}

            {scheduleImage ? (
              <Band tone="white">
                <SectionHeader
                  title={settings.schedule.title || t.schedule}
                  action={<ViewAllLink to="/schedule" label={t.openSchedule} />}
                />
                <Link
                  to="/schedule"
                  className="mt-6 block overflow-hidden rounded-card border border-border bg-card shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <img
                    src={scheduleImage}
                    alt={settings.schedule.title || t.schedule}
                    loading="lazy"
                    className="max-h-[420px] w-full object-cover object-top"
                  />
                </Link>
              </Band>
            ) : null}
          </>
        ) : (
          <Band tone="offwhite">
            <h1 className="font-display text-3xl font-bold">{t.noStories}</h1>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {t.noStoriesBody}
            </p>
          </Band>
        )}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
