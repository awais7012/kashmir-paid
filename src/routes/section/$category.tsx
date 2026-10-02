import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StoryCard } from "@/components/story/story-card";
import {
  categoryForSlug,
  sectionLabelForSlug,
  siteSettingsQueryOptions,
} from "@/lib/site-settings";
import { looksUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import { storiesByCategoryQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/section/$category")({
  loader: async ({ context, params }) => {
    const settings = await context.queryClient.ensureQueryData(siteSettingsQueryOptions);
    const category = categoryForSlug(settings, params.category);
    await context.queryClient.ensureQueryData(storiesByCategoryQueryOptions(category));
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
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  const resolved = categoryForSlug(settings, category);
  const label = sectionLabelForSlug(settings, category);
  const { data: page } = useSuspenseQuery(storiesByCategoryQueryOptions(resolved));
  // A section label is a category name the editor chose, so it may be Urdu.
  const urduLabel = looksUrdu(label);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              Section
            </p>
            <h1
              {...storyTextAttrs(urduLabel ? "ur" : "en")}
              className={cn(
                "mt-1 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] font-black",
                urduLabel && URDU_TEXT_CLASS,
              )}
            >
              {label}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {page.meta.total} {page.meta.total === 1 ? "story" : "stories"}
          </p>
        </div>

        {page.data.length > 0 ? (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {page.data.map((story) => (
              <StoryCard key={story.id} story={story} large />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid justify-items-start gap-4 border-2 border-foreground bg-card px-5 py-10">
            <h2 className="font-display text-2xl">Nothing filed here yet</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              There is no published story in {label} so far. Stories appear here as soon as they are
              published in this category.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/news"
                className="border-2 border-foreground px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                All stories
              </Link>
              <Link
                to="/"
                className="px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
