import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { VideoPlayer } from "@/components/story/video-player";
import { formatTime } from "@/lib/format";
import { siteSettingsQueryOptions } from "@/lib/site-settings";

export const Route = createFileRoute("/live")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQueryOptions),
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
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { live } = settings;
  const startedAt = live.startedAt ? formatTime(live.startedAt) : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8 lg:py-16">
        <div className="flex flex-wrap items-center gap-3">
          {live.isLive ? (
            <span className="inline-flex items-center gap-2 bg-primary px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-primary-foreground uppercase">
              <span className="signal-pulse size-2 rounded-full bg-primary-foreground" />
              {startedAt ? `Live since ${startedAt}` : "Live now"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 border-2 border-foreground px-2.5 py-1 text-[10px] font-black tracking-[0.16em] uppercase">
              <Radio className="size-3.5" />
              Broadcast
            </span>
          )}
        </div>

        <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] font-black">
          {live.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {live.description}
        </p>

        {live.video ? (
          <div className="mt-8 border-2 border-foreground">
            <VideoPlayer
              video={live.video}
              poster={live.video.thumbnail_url}
              className="aspect-video"
            />
          </div>
        ) : (
          <div className="mt-8 grid justify-items-start gap-4 border-2 border-foreground bg-card px-6 py-12">
            <h2 className="font-display text-3xl">Nothing is streaming right now</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              When the studio goes live, the broadcast plays here. Until then, the latest reporting
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
                to="/"
                className="border-2 border-foreground px-4 py-3 text-xs font-black tracking-[0.12em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
