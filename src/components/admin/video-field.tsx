import { useState } from "react";
import { MediaField } from "@/components/admin/media-field";
import { TextField } from "@/components/admin/controls";
import { VideoPlayer } from "@/components/story/video-player";
import type { StoryVideo } from "@/lib/stories";

/**
 * Preview-only parsing, kept deliberately in step with the API's rules so an
 * editor can see what they pasted. The API remains authoritative and reports its
 * own errors on save.
 */
function previewVideo(url: string): StoryVideo | null {
  const value = url.trim();
  if (!value) return null;

  if (value.startsWith("/uploads/")) {
    return {
      provider: "file",
      id: value.split("/").pop() ?? value,
      url: value,
      embed_url: value,
      thumbnail_url: null,
      title: null,
      embeddable: true,
    };
  }

  const youtube =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      value,
    ) ?? /^([A-Za-z0-9_-]{11})$/.exec(value);

  if (youtube?.[1]) {
    return {
      provider: "youtube",
      id: youtube[1],
      url: `https://www.youtube.com/watch?v=${youtube[1]}`,
      embed_url: `https://www.youtube-nocookie.com/embed/${youtube[1]}`,
      thumbnail_url: `https://i.ytimg.com/vi/${youtube[1]}/hqdefault.jpg`,
      title: null,
      embeddable: true,
    };
  }

  // A channel's permanent stream embeds only when the channel id is known.
  const channel = /youtube\.com\/channel\/(UC[A-Za-z0-9_-]{20,})\/live/.exec(value);
  if (channel?.[1]) {
    return {
      provider: "youtube",
      id: channel[1],
      url: `https://www.youtube.com/channel/${channel[1]}/live`,
      embed_url: `https://www.youtube-nocookie.com/embed/live_stream?channel=${channel[1]}`,
      thumbnail_url: null,
      title: null,
      embeddable: true,
    };
  }

  // Handles and custom URLs refuse to be framed, so the site links out instead.
  const handle = /youtube\.com\/(@[^/]+|c\/[^/]+|user\/[^/]+)\/live/.exec(value);
  if (handle?.[1]) {
    const canonical = `https://www.youtube.com/${handle[1]}/live`;
    return {
      provider: "youtube",
      id: handle[1],
      url: canonical,
      embed_url: canonical,
      thumbnail_url: null,
      title: null,
      embeddable: false,
    };
  }

  const vimeo = /vimeo\.com\/(\d{6,})/.exec(value);
  if (vimeo?.[1]) {
    return {
      provider: "vimeo",
      id: vimeo[1],
      url: `https://vimeo.com/${vimeo[1]}`,
      embed_url: `https://player.vimeo.com/video/${vimeo[1]}`,
      thumbnail_url: null,
      title: null,
      embeddable: true,
    };
  }

  return null;
}

export function VideoField({
  videoUrl,
  onVideoUrlChange,
  videoTitle,
  onVideoTitleChange,
  error,
  showCaption = true,
}: {
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  videoTitle?: string | undefined;
  onVideoTitleChange?: ((value: string) => void) | undefined;
  error?: string | undefined;
  showCaption?: boolean | undefined;
}) {
  const [mode, setMode] = useState<"link" | "upload">(
    videoUrl.startsWith("/uploads/") ? "upload" : "link",
  );
  const preview = previewVideo(videoUrl);

  return (
    <div className="grid gap-4">
      <div className="flex gap-1" role="tablist" aria-label="Video source">
        {(["link", "upload"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={mode === option}
            onClick={() => setMode(option)}
            className={`px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              mode === option
                ? "bg-foreground text-background"
                : "border-2 border-foreground hover:text-primary"
            }`}
          >
            {option === "link" ? "Paste a link" : "Upload a file"}
          </button>
        ))}
      </div>

      {mode === "link" ? (
        <TextField
          meta={{
            id: "video_url",
            label: "Video link",
            hint: "YouTube, Vimeo, or a bare YouTube id. YouTube Shorts and youtu.be links work too.",
            error,
          }}
          value={videoUrl}
          onChange={onVideoUrlChange}
          placeholder="https://www.youtube.com/watch?v=OxXKDGO-MYQ"
        />
      ) : (
        <MediaField
          id="video_file"
          kind="video"
          label="Video file"
          value={videoUrl}
          onChange={onVideoUrlChange}
          hint="MP4 or WebM. Files are stored as uploaded and are not converted, so H.264 MP4 plays reliably."
        />
      )}

      {showCaption ? (
        <TextField
          meta={{ id: "video_title", label: "Video caption", hint: "Shown under the player." }}
          value={videoTitle ?? ""}
          onChange={onVideoTitleChange ?? (() => undefined)}
          placeholder="The Valley Report, episode 4"
        />
      ) : null}

      {preview ? (
        <div className="grid gap-2">
          <p className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase">
            Preview
          </p>
          <div className="border-2 border-border">
            <VideoPlayer video={preview} />
          </div>
        </div>
      ) : videoUrl.trim() ? (
        <p className="border-2 border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          No preview for this link. The API checks it when you save and will tell you if it cannot
          be played.
        </p>
      ) : null}
    </div>
  );
}
