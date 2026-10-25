import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Download, Play } from "lucide-react";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BrandedFallback } from "@/components/story/branded-fallback";
import { StoryCard } from "@/components/story/story-card";
import { VideoPlayer } from "@/components/story/video-player";
import { formatDate, timeAgo } from "@/lib/format";
import { publicStories } from "@/lib/home-feed";
import { Markdown } from "@/lib/markdown";
import { mediaUrl } from "@/lib/media";
import { siteSettingsQueryOptions, slugifyLabel } from "@/lib/site-settings";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import {
  primeQuery,
  storiesByCategoryQueryOptions,
  storyQueryOptions,
  StoryFetchError,
  type StoryDetail,
} from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/story/$slug")({
  loader: async ({ context, params }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);

    try {
      return await primeQuery(context.queryClient, storyQueryOptions(params.slug));
    } catch (error) {
      // A missing story must be a real 404, not a thrown 500.
      if (error instanceof StoryFetchError && error.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  head: ({ loaderData }) => {
    const story = loaderData as StoryDetail | undefined;
    if (!story) return { meta: [{ title: "Story · Global Kashmir TV" }] };
    const image = mediaUrl(story.hero_image_url);

    return {
      meta: [
        { title: `${story.title} · Global Kashmir TV` },
        { name: "description", content: story.summary },
        { property: "og:title", content: story.title },
        { property: "og:description", content: story.summary },
        { property: "og:type", content: "article" },
        ...(image ? [{ property: "og:image", content: image }] : []),
      ],
    };
  },
  component: StoryPage,
  notFoundComponent: StoryNotFound,
  errorComponent: StoryError,
});

function StoryPage() {
  const { slug } = Route.useParams();
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  const { data: story, isError } = useQuery(storyQueryOptions(slug));
  const { data: categoryPage } = useQuery({
    ...storiesByCategoryQueryOptions(story?.category ?? ""),
    enabled: Boolean(story),
  });

  // Only a final answer from the API (the story is gone) ends the waiting.
  if (!story && isError) return <StoryNotFound />;
  if (!settings || !story) return <PageShimmer />;

  const cover = mediaUrl(story.hero_image_url);
  const sectionSlug = slugifyLabel(story.category);
  // Related stories obey the same rules as every other list: site language, no
  // test copy, and never the story you are already reading.
  const related = publicStories(categoryPage?.data ?? [])
    .filter((item) => item.id !== story.id)
    .slice(0, 3);
  const urdu = isUrdu(story.language);
  const textAttrs = storyTextAttrs(story.language);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      {/* The banner: the story's lead media across the page, so the article
          opens with a picture rather than a column of text. A video story puts
          its player here instead of a still, and this is the only piece of lead
          media on the page — the column below never repeats it. */}
      {story.video ? (
        <div className="border-b border-border bg-background">
          <div className="mx-auto max-w-4xl px-4 py-5 sm:px-8">
            <div className="overflow-hidden rounded-card border border-border shadow-lift">
              <VideoPlayer
                video={story.video}
                poster={story.video.thumbnail_url ?? mediaUrl(story.hero_image_url)}
              />
            </div>
            <p className="mt-2 flex items-center gap-2 text-[10px] font-black tracking-[0.14em] text-muted-foreground uppercase">
              <Play className="size-3.5 fill-current text-live" aria-hidden="true" />
              {story.video.title ?? "Watch"}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative h-[clamp(240px,38vh,460px)] w-full overflow-hidden bg-muted">
          {cover ? (
            <>
              <img
                src={cover}
                alt={story.title}
                width={1536}
                height={864}
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent"
                aria-hidden="true"
              />
            </>
          ) : (
            <BrandedFallback category={story.category} />
          )}
        </div>
      )}

      <main>
        {/* A single measured column: headline, deck, byline, media and body all
            share the same edges, so nothing looks left over or off-grid. */}
        <article className="mx-auto w-full max-w-[46rem] px-4 py-12 sm:px-8 lg:py-16">
          <Link
            to="/section/$category"
            params={{ category: sectionSlug }}
            {...textAttrs}
            className={cn(
              "inline-flex items-center gap-2 text-[11px] font-black tracking-[0.12em] text-brand-blue uppercase hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            <ArrowLeft className="size-3.5 rtl:-scale-x-100" />
            {story.category}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              {...textAttrs}
              className={cn(
                "bg-navy px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-navy-foreground uppercase",
                urdu && URDU_TEXT_CLASS,
              )}
            >
              {story.category}
            </span>
            <time
              dateTime={story.published_at}
              className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase"
            >
              {formatDate(story.published_at)} · {timeAgo(story.published_at)}
            </time>
          </div>

          <h1
            {...textAttrs}
            className={cn(
              "mt-6 text-[clamp(2.25rem,3.4vw,2.75rem)] leading-[1.15] font-extrabold tracking-tight break-words",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            {story.title}
          </h1>

          <p
            {...textAttrs}
            className={cn(
              "mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            {story.summary}
          </p>

          {/* The byline follows the page direction, so it sits on the reading
              edge in both builds. */}
          <p
            {...textAttrs}
            className={cn(
              "mt-8 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            By {story.author}
          </p>

          {story.document_url ? (
            <a
              href={mediaUrl(story.document_url) ?? story.document_url}
              target="_blank"
              rel="noreferrer"
              className="mt-10 flex items-center justify-between gap-4 rounded-card border border-border bg-card px-4 py-4 shadow-card transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="grid gap-1">
                <span className="text-[10px] font-black tracking-[0.14em] text-muted-foreground uppercase">
                  Attached document
                </span>
                <span className="font-display text-lg font-bold">Open the PDF</span>
              </span>
              <Download className="size-5 shrink-0 text-primary" aria-hidden="true" />
            </a>
          ) : null}

          {story.body ? (
            <div {...textAttrs} className={cn("mt-12", urdu && URDU_TEXT_CLASS)}>
              <Markdown source={story.body} />
            </div>
          ) : null}

          <div className="mt-16 border-t border-border pt-6">
            <Link
              to="/section/$category"
              params={{ category: sectionSlug }}
              className="inline-flex items-center gap-2 text-xs font-black tracking-[0.12em] text-brand-blue uppercase hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              More from {story.category}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="page-shell border-t border-border py-8">
            <h2 className="text-2xl font-extrabold tracking-tight">More stories</h2>
            <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <StoryCard key={item.id} story={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}

function StoryMessage({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="max-w-md">
        <p className="text-6xl leading-none font-black">404</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{heading}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-sm bg-navy px-4 py-3 text-xs font-black tracking-[0.12em] text-navy-foreground uppercase hover:bg-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            Go home
          </Link>
          <Link
            to="/news"
            className="rounded-sm border border-border px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-navy hover:text-navy-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            All stories
          </Link>
        </div>
      </div>
    </div>
  );
}

function StoryNotFound() {
  return (
    <StoryMessage
      heading="That story is not here"
      body="The link may be out of date, or the story has not been published yet."
    />
  );
}

function StoryError({ error }: { error: Error }) {
  return (
    <StoryMessage
      heading="This story did not load"
      body={
        error.message ||
        "Something went wrong fetching this article. Try again, or browse the latest stories."
      }
    />
  );
}
