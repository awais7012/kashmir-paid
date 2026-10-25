import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ExternalLink } from "lucide-react";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { mediaUrl } from "@/lib/media";
import { t } from "@/lib/i18n";
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

      <main className="page-shell py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-brand-blue uppercase">
              {t.onAir}
            </p>
            <h1 className="mt-1 text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-extrabold tracking-tight">
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
              className="block overflow-hidden rounded-card border border-border bg-card shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
            >
              {/* Capped to the viewport so a tall schedule does not force a long
                  scroll; the whole picture still opens at full size on tap. */}
              <img
                src={image}
                alt={`Programme schedule for Global Kashmir TV${
                  schedule.caption ? `, ${schedule.caption}` : ""
                }`}
                className="mx-auto block max-h-[75vh] w-full object-contain"
              />
            </a>
            <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Tap the schedule to open it full size.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid justify-items-start gap-4 rounded-card border border-border bg-card px-5 py-12 shadow-card">
            <CalendarDays className="size-8 text-brand-blue" aria-hidden="true" />
            <h2 className="text-2xl font-extrabold tracking-tight">The schedule is not up yet</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              The programme schedule has not been published. In the meantime, the latest reporting
              is still worth your time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/news"
                className="rounded-sm bg-navy px-4 py-3 text-xs font-black tracking-[0.12em] text-navy-foreground uppercase hover:bg-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                Read the latest
              </Link>
              <Link
                to="/live"
                className="rounded-sm border border-border px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-navy hover:text-navy-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                Watch live
              </Link>
            </div>
          </div>
        )}

        {schedule.note ? (
          <p className="mt-8 max-w-prose border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
            {schedule.note}
          </p>
        ) : null}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
