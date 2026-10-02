import { storyImage } from "@/lib/story-images";
import { API_BASE_URL } from "@/lib/stories";

/**
 * Uploaded media is served by the API, so a stored path like /uploads/x.jpg has
 * to be resolved against the API origin rather than the site origin.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/** An uploaded hero wins; otherwise fall back to one of the bundled photos. */
export function storyCoverUrl(story: { hero_image_url: string | null; image_key: string }): string {
  return mediaUrl(story.hero_image_url) ?? storyImage(story.image_key);
}
