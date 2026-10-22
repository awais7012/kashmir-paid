import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ExternalLink } from "lucide-react";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { mediaUrl } from "@/lib/media";
import { primeQuery } from "@/lib/stories";
import { siteSettingsQueryOptions } from "@/lib/site-settings";

export const Route = createFileRoute("/schedule")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Programme schedule · Global Kashmir TV" },
      {
        name: "description",
        content: "See what is on Global Kashmir TV and when, with the latest programme schedule.",
      },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  if (!settings) return <PageShimmer />;

  const { schedule } = settings;
  const image = mediaUrl(schedule.image);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">On air</p>
            <h1 className="mt-1 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] font-black">
              {schedule.title || "Programme Schedule"}
            </h1>
          </div>
          {schedule.caption ? (
            <p className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
              {schedule.caption}
            </p>
          ) : null}
        </div>

        {image ? (
          <div className="mt-8 grid gap-4">
            <a
              href={image}
              target="_blank"
              rel="noreferrer"
              className="block border-2 border-foreground bg-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <img
                src={image}
                alt={`Programme schedule for Global Kashmir TV${
                  schedule.caption ? `, ${schedule.caption}` : ""
                }`}
                className="h-auto w-full"
              />
            </a>
            <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Tap the schedule to open it full size.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid justify-items-start gap-4 border-2 border-foreground bg-card px-5 py-12">
            <CalendarDays className="size-8 text-primary" aria-hidden="true" />
            <h2 className="font-display text-3xl">The schedule is not up yet</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              The programme schedule has not been published. In the meantime, the latest reporting
              is still worth your time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/news"
                className="bg-foreground px-4 py-3 text-xs font-black tracking-[0.12em] text-background uppercase hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Read the latest
              </Link>
              <Link
                to="/live"
                className="border-2 border-foreground px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Watch live
              </Link>
            </div>
          </div>
        )}

        {schedule.note ? (
          <p className="mt-8 max-w-prose border-t-2 border-foreground pt-6 text-sm leading-relaxed text-muted-foreground">
            {schedule.note}
          </p>
        ) : null}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
