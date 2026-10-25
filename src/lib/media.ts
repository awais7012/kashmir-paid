import { API_BASE_URL } from "@/lib/stories";

/**
 * Uploaded media is served by the API, so a stored path like /uploads/x.jpg has
 * to be resolved against the API origin rather than the site origin.
 *
 * A story with no uploaded cover is not given a stock photograph: the cards and
 * the story banner fall back to the branded plate (`BrandedFallback`).
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}
