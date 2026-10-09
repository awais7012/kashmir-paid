import { queryOptions } from "@tanstack/react-query";
import { getJson, waitForApi } from "@/lib/stories";

export type NavSectionKind = "home" | "index" | "live" | "category";

export type NavSection = {
  label: string;
  kind: NavSectionKind;
  category: string;
  visible: boolean;
};

export type SiteSettings = {
  hero: {
    eyebrow: string;
    headline: string;
    accent: string;
    primaryCta: string;
    secondaryCta: string;
    /** Uploaded artwork. When empty, the featured story's cover is used. */
    image: string;
    /** The video link exactly as pasted in the studio. */
    videoUrl: string;
    /** Derived by the API so the client never parses video links itself. */
    video: VideoDto | null;
  };
  ticker: { enabled: boolean; label: string };
  live: {
    streamUrl: string;
    title: string;
    description: string;
    isLive: boolean;
    /** Set by the API when the broadcast started; empty while off air. */
    startedAt: string;
    video: VideoDto | null;
  };
  nav: { sections: NavSection[] };
  footer: { note: string; copyright: string };
};

export type VideoDto = {
  provider: string;
  id: string;
  url: string;
  embed_url: string;
  thumbnail_url: string | null;
  title: string | null;
  /** False when the destination cannot be framed, so the UI links out instead. */
  embeddable: boolean;
};

export async function fetchSettings(): Promise<SiteSettings> {
  return (await getJson<{ data: SiteSettings }>("/api/settings")).data;
}

export const siteSettingsQueryOptions = queryOptions({
  queryKey: ["site-settings"],
  queryFn: fetchSettings,
  ...waitForApi,
  staleTime: 60_000,
});

export const SUGGESTED_CATEGORIES = [
  "Kashmir",
  "Pakistan",
  "World",
  "Global",
  "Heritage",
  "Tourism",
  "Sports",
  "Shows",
  "Videos",
  "Library",
  // Urdu sections. A story written in Urdu usually belongs to one of these.
  "کشمیر",
  "پاکستان",
  "دنیا",
  "ورثہ",
  "سیاحت",
  "کھیل",
  "شوز",
  "کتب خانہ",
];

/**
 * Section URLs are built from a nav label, so the slug has to survive in a
 * link. Letters and digits of any script are kept, which means an Urdu label
 * yields a readable (percent-encoded) Urdu slug rather than nothing at all.
 */
export function slugifyLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function visibleSections(settings: SiteSettings): NavSection[] {
  return settings.nav.sections.filter((section) => section.visible);
}

/** Every nav entry resolves to a real route. */
export function navHref(section: NavSection): string {
  if (section.kind === "home") return "/";
  if (section.kind === "live") return "/live";
  if (section.kind === "index") return "/news";
  return `/section/${slugifyLabel(section.label)}`;
}

/**
 * A section route param is a label slug, so map it back to the stored category
 * (they differ for multi-word labels). Unknown slugs fall through unchanged,
 * which still matches single-word categories case-insensitively.
 */
export function categoryForSlug(settings: SiteSettings, slug: string): string {
  const match = settings.nav.sections.find(
    (section) => section.kind === "category" && slugifyLabel(section.label) === slug,
  );
  return match ? match.category : slug;
}

export function sectionLabelForSlug(settings: SiteSettings, slug: string): string {
  const match = settings.nav.sections.find(
    (section) => section.kind === "category" && slugifyLabel(section.label) === slug,
  );
  return match ? match.label : slug.replace(/-/g, " ");
}
