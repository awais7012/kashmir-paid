import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { VideoPlayer } from "@/components/story/video-player";
import { formatTime } from "@/lib/format";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { primeQuery } from "@/lib/stories";

export const Route = createFileRoute("/live")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Watch live · Global Kashmir TV" },
      {
        name: "description",
        content: "Watch Global Kashmir TV live from the valley.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  if (!settings) return <PageShimmer />;

  const { live } = settings;
  const startedAt = live.startedAt ? formatTime(live.startedAt) : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="page-shell py-10 lg:py-14">
        <div className="flex flex-wrap items-center gap-3">
          {live.isLive ? (
            <span className="inline-flex items-center gap-2 bg-live px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-live-foreground uppercase">
              <span className="signal-pulse size-2 rounded-full bg-live-foreground" />
              {startedAt ? `Live since ${startedAt}` : "Live now"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-sm border border-border px-2.5 py-1 text-[10px] font-black tracking-[0.16em] uppercase">
              <Radio className="size-3.5" />
              Broadcast
            </span>
          )}
        </div>

        <h1 className="mt-5 text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-extrabold tracking-tight">
          {live.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {live.description}
        </p>

        {live.video ? (
          <div className="mt-8 overflow-hidden rounded-card border border-border shadow-card">
            <VideoPlayer
              video={live.video}
              poster={live.video.thumbnail_url}
              className="aspect-video"
            />
          </div>
        ) : (
          <div className="mt-8 grid justify-items-start gap-4 rounded-card border border-border bg-card px-6 py-12 shadow-card">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Nothing is streaming right now
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              When the studio goes live, the broadcast plays here. Until then, the latest reporting
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
                to="/"
                className="rounded-sm border border-border px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-navy hover:text-navy-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
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
