// Normalises the video links an editor might paste.
//
// Accepts YouTube (watch / shorts / live / embed / youtu.be / a channel's live
// URL), Vimeo, a bare 11-character YouTube id, or a path to a file this API
// already stores.

export type VideoProvider = "youtube" | "vimeo" | "file";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  /** False when the destination refuses to be framed, so the UI links out. */
  embeddable: boolean;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_CHANNEL_ID = /^UC[A-Za-z0-9_-]{20,}$/;
const FILE_EXTENSION = /\.(mp4|webm|mov|m4v)$/i;

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function youtube(id: string): ParsedVideo {
  return {
    provider: "youtube",
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    // youtube-nocookie avoids setting YouTube cookies before playback.
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    embeddable: true,
  };
}

/** A channel's permanent live stream. YouTube only embeds these by channel id. */
function youtubeChannelLive(channelId: string): ParsedVideo {
  return {
    provider: "youtube",
    id: channelId,
    url: `https://www.youtube.com/channel/${channelId}/live`,
    embedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}`,
    thumbnailUrl: null,
    embeddable: true,
  };
}

/**
 * Channel handles and custom URLs cannot be resolved to a video id without the
 * YouTube API, and a channel page refuses to be framed, so this stays a link out
 * rather than a silently broken player.
 */
function youtubeChannelLink(canonicalUrl: string, handle: string): ParsedVideo {
  return {
    provider: "youtube",
    id: handle,
    url: canonicalUrl,
    embedUrl: canonicalUrl,
    thumbnailUrl: null,
    embeddable: false,
  };
}

function vimeo(id: string): ParsedVideo {
  return {
    provider: "vimeo",
    id,
    url: `https://vimeo.com/${id}`,
    embedUrl: `https://player.vimeo.com/video/${id}`,
    thumbnailUrl: null,
    embeddable: true,
  };
}

function storedFile(value: string): ParsedVideo {
  return {
    provider: "file",
    id: value.split("/").pop() ?? value,
    url: value,
    embedUrl: value,
    thumbnailUrl: null,
    embeddable: true,
  };
}

export function parseVideoUrl(input: string): ParsedVideo | null {
  const value = input.trim();
  if (!value) return null;

  // A file this API serves, either as a stored path or an absolute URL.
  if (value.startsWith("/uploads/")) return storedFile(value);
  if (/^https?:\/\//i.test(value) && FILE_EXTENSION.test(new URL(value).pathname)) {
    return storedFile(value);
  }

  // Bare YouTube id.
  if (YOUTUBE_ID.test(value)) return youtube(value);

  const host = hostnameOf(value);
  if (!host) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0] ?? "";
    return YOUTUBE_ID.test(id) ? youtube(id) : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = parsed.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return youtube(v);

    const byId = parsed.pathname.match(/^\/(?:shorts|live|embed|v)\/([A-Za-z0-9_-]{11})(?:[/?]|$)/);
    if (byId?.[1]) return youtube(byId[1]);

    // A channel's permanent stream: /channel/UC…/live embeds by channel id.
    const channel = parsed.pathname.match(/^\/channel\/(UC[A-Za-z0-9_-]{20,})\/live\/?$/);
    if (channel?.[1] && YOUTUBE_CHANNEL_ID.test(channel[1])) {
      return youtubeChannelLive(channel[1]);
    }

    // Handles and custom URLs cannot be embedded, so they become a link out.
    const handle = parsed.pathname.match(/^\/(@[^/]+|c\/[^/]+|user\/[^/]+)\/live\/?$/);
    if (handle?.[1]) {
      return youtubeChannelLink(`https://www.youtube.com/${handle[1]}/live`, handle[1]);
    }

    if (/^\/live\/?$/.test(parsed.pathname)) {
      return youtubeChannelLink("https://www.youtube.com/live", "live");
    }

    return null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = parsed.pathname.match(/(\d{6,})/);
    return match?.[1] ? vimeo(match[1]) : null;
  }

  return null;
}

/** Used by the admin panel to explain a rejection in plain language. */
export const VIDEO_URL_HINT =
  "Paste a YouTube or Vimeo link, or an uploaded video path. Examples: " +
  "https://www.youtube.com/watch?v=OxXKDGO-MYQ, https://youtu.be/OxXKDGO-MYQ, " +
  "https://www.youtube.com/@YourChannel/live, https://vimeo.com/76979871, " +
  "or /uploads/2026/09/clip.mp4";

/** Stream links are held to the same rules as any other video link. */
export const STREAM_URL_HINT =
  "Paste the link YouTube gives you for the broadcast. For a channel that is always " +
  "live, use https://www.youtube.com/@YourChannel/live (the page links out) or a " +
  "channel/UC…/live URL (which embeds).";
