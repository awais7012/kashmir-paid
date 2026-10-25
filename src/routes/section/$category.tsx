import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StoryCard } from "@/components/story/story-card";
import { publicStories } from "@/lib/home-feed";
import { t } from "@/lib/i18n";
import {
  categoryForSlug,
  sectionLabelForSlug,
  siteSettingsQueryOptions,
} from "@/lib/site-settings";
import { looksUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import { primeQuery, storiesByCategoryQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/section/$category")({
  loader: async ({ context, params }) => {
    const settings = await primeQuery(context.queryClient, siteSettingsQueryOptions);
    // Without the nav settings the slug cannot be resolved; the page does it once they load.
    if (!settings) return undefined;

    const category = categoryForSlug(settings, params.category);
    await primeQuery(context.queryClient, storiesByCategoryQueryOptions(category));
    return { category, label: sectionLabelForSlug(settings, params.category) };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.label ?? "Section"} · Global Kashmir TV` },
      {
        name: "description",
        content: `Latest ${loaderData?.label ?? "stories"} from Global Kashmir TV.`,
      },
    ],
  }),
  component: SectionPage,
});

function SectionPage() {
  const { category } = Route.useParams();
  const { data: settings } = useQuery(siteSettingsQueryOptions);

  const resolved = settings ? categoryForSlug(settings, category) : "";
  const { data: page } = useQuery({
    ...storiesByCategoryQueryOptions(resolved),
    enabled: Boolean(settings),
  });

  if (!settings || !page) return <PageShimmer />;

  // A section lists one language: the one this deployment publishes in.
  const stories = publicStories(page.data);
  // The display name, not the slug: "top-stories" reads as "Top Stories".
  const label = sectionLabelForSlug(settings, category);
  const urduLabel = looksUrdu(label);
  const [lead, ...rest] = stories;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="page-shell py-8 lg:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-brand-blue uppercase">
              Section
            </p>
            <h1
              {...storyTextAttrs(urduLabel ? "ur" : "en")}
              className={cn(
                // A section name is editor-supplied and can be long or a single
                // unbroken word, so it wraps rather than overflowing the page.
                "mt-1 text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-extrabold tracking-tight break-words",
                urduLabel && URDU_TEXT_CLASS,
              )}
            >
              {label}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {stories.length} {stories.length === 1 ? t.story : t.stories}
          </p>
        </div>

        {lead ? (
          // A short section gets a lead and a list rather than a grid with two
          // empty columns.
          stories.length < 4 ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <StoryCard story={lead} variant="large" />
              {rest.length > 0 ? (
                <ul className="grid content-start gap-4 self-start">
                  {rest.map((story) => (
                    <li key={story.id}>
                      <StoryCard story={story} variant="compact" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} variant="large" />
              ))}
            </div>
          )
        ) : (
          <div className="mt-6 grid justify-items-start gap-3 rounded-card border border-border bg-card px-5 py-8 shadow-card">
            <h2 className="text-xl font-extrabold tracking-tight">Nothing filed here yet</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              There is no published story in {label} so far. Stories appear here as soon as they are
              published in this category.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/news"
                className="rounded-sm bg-navy px-4 py-2.5 text-xs font-black tracking-[0.12em] text-navy-foreground uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                All stories
              </Link>
              <Link
                to="/"
                className="rounded-sm px-4 py-2.5 text-xs font-black tracking-[0.12em] uppercase hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Go home
              </Link>
            </div>
          </div>
        )}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
