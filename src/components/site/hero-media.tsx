import { useState } from "react";
import { Play } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import type { VideoDto } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

/**
 * Lead media for a hero block.
 *
 * An uploaded file plays as muted, looping background footage, with the poster
 * photograph underneath so a reduced-motion viewer, or a browser that refuses
 * autoplay, still sees the image. A third-party embed cannot be a dependable
 * background, so it stays a click-to-play overlay on that photograph.
 */
export function HeroMedia({
  image,
  video,
  alt,
  className,
}: {
  image: string;
  video: VideoDto | null;
  alt: string;
  className?: string | undefined;
}) {
  const [playing, setPlaying] = useState(false);
  const isFile = video?.provider === "file";
  const fileUrl = isFile ? mediaUrl(video?.url) : null;

  return (
    <div className={cn("absolute inset-0", className)}>
      <img
        src={image}
        width={1536}
        height={1024}
        fetchPriority="high"
        alt={alt}
        className="story-image absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02]"
      />

      {fileUrl ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={image}
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
        >
          <source src={fileUrl} />
        </video>
      ) : null}

      {video && !isFile ? (
        playing ? (
          <iframe
            src={`${video.embed_url}${video.embed_url.includes("?") ? "&" : "?"}autoplay=1&mute=1`}
            title={video.title ?? "Hero video"}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={video.title ? `Play ${video.title}` : "Play the hero video"}
            className="absolute inset-0 grid place-items-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"
          >
            <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 sm:size-20">
              <Play className="size-6 fill-current sm:size-7" />
            </span>
          </button>
        )
      ) : null}
    </div>
  );
}
