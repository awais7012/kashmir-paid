import { ExternalLink, Play } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import type { StoryVideo } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * Renders a story's video: a responsive embed for YouTube/Vimeo, or a native
 * player for a file this API stores (which supports seeking via Range requests).
 */
export function VideoPlayer({
  video,
  poster,
  className,
}: {
  video: StoryVideo;
  poster?: string | null;
  className?: string;
}) {
  if (video.provider === "file") {
    const source = mediaUrl(video.url);
    if (!source) return null;

    return (
      <video
        controls
        preload="metadata"
        poster={poster ?? undefined}
        className={cn("aspect-video w-full bg-foreground", className)}
      >
        <source src={source} />
        Your browser cannot play this video. Download it instead.
      </video>
    );
  }

  // A channel page cannot be framed, so a silent error inside an iframe would be
  // worse than an honest link out.
  if (!video.embeddable) {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden bg-foreground", className)}>
        {poster ? (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        ) : null}
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-background">
          <div>
            <p className="text-[10px] font-black tracking-[0.16em] text-background/70 uppercase">
              Opens on YouTube
            </p>
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs font-black tracking-[0.12em] text-primary-foreground uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Play className="size-4 fill-current" />
              {video.title ?? "Watch on YouTube"}
              <ExternalLink className="size-3.5" />
            </a>
            <p className="mt-3 text-xs text-background/70">
              This channel cannot be played inside the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-foreground", className)}>
      <iframe
        src={video.embed_url}
        title={video.title ?? "Video"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 size-full border-0"
      />
    </div>
  );
}
