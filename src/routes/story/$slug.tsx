import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StoryCard } from "@/components/story/story-card";
import { VideoPlayer } from "@/components/story/video-player";
import { formatDate, timeAgo } from "@/lib/format";
import { Markdown } from "@/lib/markdown";
import { mediaUrl, storyCoverUrl } from "@/lib/media";
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

  const cover = storyCoverUrl(story);
  const sectionSlug = slugifyLabel(story.category);
  const related = (categoryPage?.data ?? []).filter((item) => item.id !== story.id).slice(0, 3);
  const urdu = isUrdu(story.language);
  const textAttrs = storyTextAttrs(story.language);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main>
        <article className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 lg:py-14">
          <Link
            to="/section/$category"
            params={{ category: sectionSlug }}
            {...textAttrs}
            className={cn(
              "inline-flex items-center gap-2 text-[11px] font-black tracking-[0.12em] uppercase hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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
                "bg-primary px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-primary-foreground uppercase",
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
              "mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.92] font-black",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            {story.title}
          </h1>

          <p
            {...textAttrs}
            className={cn(
              "mt-6 max-w-3xl font-display text-xl leading-snug text-muted-foreground italic sm:text-2xl",
              urdu && URDU_TEXT_CLASS,
            )}
          >
            {story.summary}
          </p>

          <p className="mt-6 text-[10px] font-black tracking-[0.16em] uppercase">
            By {story.author}
          </p>

          <div className="mt-8 overflow-hidden border-2 border-foreground bg-muted">
            <img
              src={cover}
              alt={story.title}
              width={1536}
              height={1024}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>

          {story.video ? (
            <figure className="mt-8 grid gap-3">
              <div className="border-2 border-foreground">
                <VideoPlayer video={story.video} poster={story.video.thumbnail_url ?? cover} />
              </div>
              <figcaption className="flex items-center gap-2 text-[10px] font-black tracking-[0.14em] uppercase">
                <Play className="size-3.5 fill-current text-primary" />
                {story.video.title ?? "Watch"}
              </figcaption>
            </figure>
          ) : null}

          {story.body ? (
            <div
              {...textAttrs}
              className={cn(
                "mt-10 max-w-[70ch]",
                // Urdu reads from the right, so the measure hugs that edge too.
                urdu ? cn(URDU_TEXT_CLASS, "me-auto") : null,
              )}
            >
              <Markdown source={story.body} />
            </div>
          ) : null}

          <div className="mt-12 border-t-2 border-foreground pt-6">
            <Link
              to="/section/$category"
              params={{ category: sectionSlug }}
              className="inline-flex items-center gap-2 text-xs font-black tracking-[0.12em] uppercase hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              More from {story.category}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="mx-auto max-w-[1440px] border-t-2 border-foreground px-4 py-12 sm:px-8 lg:px-12">
            <h2 className="font-display text-3xl sm:text-4xl">More stories</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="font-display text-6xl leading-none">404</p>
        <h1 className="mt-4 font-display text-3xl">{heading}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/"
            className="bg-foreground px-4 py-3 text-xs font-black tracking-[0.12em] text-background uppercase hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Go home
          </Link>
          <Link
            to="/news"
            className="border-2 border-foreground px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
