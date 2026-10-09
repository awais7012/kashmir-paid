import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Play } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { HeroMedia } from "@/components/site/hero-media";
import { PageShimmer } from "@/components/site/page-shimmer";
import { StoryCard } from "@/components/story/story-card";
import { mediaUrl, storyCoverUrl } from "@/lib/media";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function SectionHeader({
  eyebrow,
  title,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b-2 pb-3 ${dark ? "border-primary-foreground/25" : "border-foreground"}`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-black tracking-[0.18em] text-primary uppercase">{eyebrow}</p>
        <h2 className="mt-1 font-display text-4xl leading-none sm:text-5xl">{title}</h2>
      </div>
      <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
    </div>
  );
}

function Index() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  const { data: stories } = useQuery(storiesQueryOptions);

  if (!settings || !stories) return <PageShimmer />;

  // A scheduled story can carry the featured flag before it is public. When
  // several featured stories are live at once, the newest one is the hero.
  const featured = stories.filter((story) => story.featured);
  const lead = featured.length
    ? featured.reduce((newest, story) =>
        story.published_at > newest.published_at ? story : newest,
      )
    : stories[0];
  const latest = stories.filter((story) => story.id !== lead?.id).slice(0, 3);
  const top = stories.filter((story) => story.id !== lead?.id).slice(0, 4);
  const culture = stories
    .filter((story) => ["Kashmir", "Heritage"].includes(story.category))
    .slice(0, 3);
  const world = stories
    .filter((story) => ["Pakistan", "World", "Global"].includes(story.category))
    .slice(0, 3);
  const show = stories.find((story) => story.category === "Shows");
  const tourism = stories.find((story) => story.category === "Tourism");
  const sports = stories.find((story) => story.category === "Sports");

  if (!lead) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader settings={settings} />
        <main className="mx-auto max-w-[1100px] px-4 py-24 sm:px-8">
          <h1 className="font-display text-5xl leading-none">No stories published yet</h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Once a story is published from the studio it appears here.
          </p>
        </main>
        <SiteFooter settings={settings} />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader settings={settings} />

      {settings.ticker.enabled ? (
        <div className="flex overflow-hidden border-b-2 border-foreground bg-primary text-primary-foreground">
          <div className="z-10 flex shrink-0 items-center gap-2 bg-foreground px-4 py-2.5 text-[10px] font-black tracking-[0.16em] text-background uppercase">
            <span className="signal-pulse size-2 rounded-full bg-primary" />
            {settings.ticker.label}
          </div>
          <div className="ticker-track flex w-max min-w-max items-center py-2.5 text-xs font-bold tracking-[0.08em] whitespace-nowrap hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
            {[...stories.slice(0, 5), ...stories.slice(0, 5)].map((story, index) => (
              <Link
                key={`${story.id}-${index}`}
                to="/story/$slug"
                params={{ slug: story.slug }}
                {...storyTextAttrs(story.language)}
                className={cn(
                  "px-6 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  isUrdu(story.language) && URDU_TEXT_CLASS,
                )}
              >
                {story.title} <span className="ms-6 opacity-50">◆</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <main>
        <section className="mx-auto grid max-w-[1440px] grid-cols-1 bg-card lg:grid-cols-12">
          <article className="group border-b border-border p-4 sm:p-8 lg:col-span-8 lg:border-r lg:p-10">
            <div className="relative min-h-[430px] overflow-hidden sm:min-h-[590px]">
              <HeroMedia
                image={mediaUrl(settings.hero.image) ?? storyCoverUrl(lead)}
                video={settings.hero.video}
                alt={lead.title}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/10 to-transparent" />
              {/* The copy sits above the media, so it must not swallow clicks
                  meant for the hero's play button; only the CTAs take input. */}
              <div className="editorial-rise pointer-events-none absolute inset-x-0 bottom-0 p-5 text-background sm:p-9">
                <p className="mb-3 inline-flex bg-primary px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-primary-foreground uppercase">
                  {settings.hero.eyebrow}
                </p>
                <h1 className="max-w-4xl font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.84] font-black">
                  {settings.hero.headline}
                  <br />
                  <em className="font-normal text-primary">{settings.hero.accent}</em>
                </h1>
                <p
                  {...storyTextAttrs(lead.language)}
                  className={cn(
                    "mt-5 max-w-2xl text-sm leading-relaxed text-background/80 sm:text-lg",
                    isUrdu(lead.language) && URDU_TEXT_CLASS,
                  )}
                >
                  {lead.summary}
                </p>
                <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/live"
                    className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs font-black tracking-[0.12em] text-primary-foreground uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Play className="size-4 fill-current" />
                    {settings.hero.primaryCta}
                  </Link>
                  <a
                    href="#top-stories"
                    className="inline-flex items-center gap-2 border border-background px-5 py-3 text-xs font-black tracking-[0.12em] text-background uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {settings.hero.secondaryCta}
                    <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </article>

          <aside className="flex flex-col lg:col-span-4">
            <div className="p-6 sm:p-8">
              <p className="mb-8 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                <span className="h-px w-5 bg-border" />
                The latest
              </p>
              <div className="space-y-8">
                {latest.map((story, index) => (
                  <Link
                    key={story.id}
                    to="/story/$slug"
                    params={{ slug: story.slug }}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="font-display text-4xl leading-none text-border italic">
                      0{index + 1}
                    </span>
                    <div className="min-w-0">
                      <h2
                        {...storyTextAttrs(story.language)}
                        className={cn(
                          "font-display text-2xl leading-[1.05] font-bold hover:text-primary",
                          isUrdu(story.language) && URDU_TEXT_CLASS,
                        )}
                      >
                        {story.title}
                      </h2>
                      <p
                        {...storyTextAttrs(story.language)}
                        className={cn(
                          "mt-2 text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase",
                          isUrdu(story.language) && URDU_TEXT_CLASS,
                        )}
                      >
                        {story.category}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div id="live" className="mt-auto bg-foreground p-8 text-center text-background">
              <p className="flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.18em] text-primary uppercase">
                <span className="signal-pulse size-2 rounded-full bg-primary" />
                {settings.live.isLive ? "Live now" : "Broadcast"}
              </p>
              <blockquote className="mt-5 font-display text-3xl leading-tight italic">
                “{settings.live.title}”
              </blockquote>
              <p className="mt-3 text-sm leading-relaxed text-background/70">
                {settings.live.description}
              </p>
              <Link
                to="/live"
                className="mt-7 inline-flex items-center gap-2 border border-background px-5 py-3 text-xs font-black tracking-[0.12em] uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Play className="size-4 fill-current" />
                Open broadcast
              </Link>
            </div>
          </aside>
        </section>

        <section
          id="top-stories"
          className="mx-auto max-w-[1440px] border-t-2 border-foreground bg-card px-4 py-14 sm:px-8 lg:px-12 lg:py-20"
        >
          <SectionHeader eyebrow="Top stories" title="Kashmir · Pakistan · World" />
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {top.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>

        <section id="kashmir" className="bg-foreground text-background">
          <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
            <SectionHeader eyebrow="Kashmir" title="People · Issues · Future" dark />
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {culture.map((story) => (
                <StoryCard key={story.id} story={story} large />
              ))}
            </div>
          </div>
        </section>

        <section
          id="world"
          className="mx-auto max-w-[1440px] bg-card px-4 py-14 sm:px-8 lg:px-12 lg:py-20"
        >
          <SectionHeader eyebrow="Global" title="News from around the world" />
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {world.map((story) => (
              <StoryCard key={story.id} story={story} large />
            ))}
          </div>
        </section>

        {show ? (
          <section
            id="shows"
            className="border-y-2 border-foreground bg-primary text-primary-foreground"
          >
            <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
              <div className="p-8 sm:p-12 lg:p-16">
                <p className="text-[10px] font-black tracking-[.2em] uppercase">
                  Shows &amp; videos
                </p>
                <h2 className="mt-5 font-display text-5xl leading-[.95] sm:text-7xl">
                  Interviews.
                  <br />
                  Analysis.
                  <br />
                  <em>Originals.</em>
                </h2>
                <p
                  {...storyTextAttrs(show.language)}
                  className={cn(
                    "mt-6 max-w-lg text-sm leading-relaxed opacity-80",
                    isUrdu(show.language) && URDU_TEXT_CLASS,
                  )}
                >
                  {show.summary}
                </p>
                {show.has_video ? (
                  <Link
                    to="/story/$slug"
                    params={{ slug: show.slug }}
                    className="mt-8 inline-flex items-center gap-2 bg-foreground px-5 py-3 text-xs font-black tracking-[.12em] text-background uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Play className="size-4 fill-current" />
                    Watch now
                  </Link>
                ) : (
                  <Link
                    to="/section/$category"
                    params={{ category: "shows" }}
                    className="mt-8 inline-flex items-center gap-2 bg-foreground px-5 py-3 text-xs font-black tracking-[.12em] text-background uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Play className="size-4 fill-current" />
                    More shows
                  </Link>
                )}
              </div>
              <Link
                to="/story/$slug"
                params={{ slug: show.slug }}
                className="relative block min-h-[380px] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"
                aria-label={show.title}
              >
                <img
                  loading="lazy"
                  width={1024}
                  height={768}
                  src={storyCoverUrl(show)}
                  alt={show.title}
                  className="absolute inset-0 h-full w-full object-cover grayscale"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-20 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Play className="size-7 fill-current" />
                  </span>
                </span>
              </Link>
            </div>
          </section>
        ) : null}

        <section className="mx-auto grid max-w-[1440px] border-b-2 border-foreground bg-card md:grid-cols-2">
          {tourism ? (
            <div
              id="tourism"
              className="border-b border-border p-4 py-12 sm:p-8 md:border-b-0 md:border-r lg:p-12"
            >
              <StoryCard story={tourism} large />
            </div>
          ) : null}
          {sports ? (
            <div id="sports" className="p-4 py-12 sm:p-8 lg:p-12">
              <StoryCard story={sports} large />
            </div>
          ) : null}
        </section>

        <section id="library" className="bg-card px-4 py-16 text-center sm:px-8 lg:py-24">
          <p className="text-[10px] font-black tracking-[.25em] text-primary uppercase">
            Library · History · Heritage · Knowledge
          </p>
          <h2 className="mx-auto mt-5 max-w-5xl font-display text-[clamp(3rem,8vw,7rem)] leading-[.88]">
            See Kashmir.
            <br />
            Hear Kashmir.
            <br />
            <em>Understand Kashmir.</em>
          </h2>
          <Link
            to="/section/$category"
            params={{ category: "library" }}
            className="mt-8 inline-flex items-center gap-2 border-2 border-foreground px-5 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Enter the library
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
