import { queryOptions } from "@tanstack/react-query";
import { getJson, waitForApi } from "@/lib/stories";

export type NavSectionKind = "home" | "index" | "live" | "category";

export type NavSection = {
  label: string;
  kind: NavSectionKind;
  category: string;
  visible: boolean;
};

/** One frame of the homepage slider: a full picture or a video. */
export type HeroSlide = {
  url: string;
  kind: "image" | "video";
  /** When set, the slide is an advert and clicking it opens this address. */
  link: string;
};

/** A person listed on the Team page. */
export type TeamMember = {
  /** Stable key for the studio's list editor. */
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
};

/**
 * One block of the published org chart. A role line may carry its own detail
 * after a dash, e.g. "Director of News — editors".
 */
export type TeamSection = {
  id: string;
  title: string;
  description: string;
  roles: string[];
};

export type SiteSettings = {
  hero: {
    /** Full pictures or videos for the homepage slider, in order. */
    slides: HeroSlide[];
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
  /** The programme schedule, uploaded as a picture and shown as-is on /schedule. */
  schedule: {
    image: string;
    title: string;
    caption: string;
    note: string;
  };
  /** Shown on the Contact page. */
  contact: {
    address: string;
    phone: string;
    email: string;
    whatsapp: string;
  };
  /** Drives the header and footer icons; empty links are simply not shown. */
  social: {
    instagram: string;
    twitter: string;
    facebook: string;
    youtube: string;
    /**
     * Optional: the API does not return this yet, so the icon stays hidden
     * until a value is ever configured. Typed here so nothing has to change
     * when it is added server-side.
     */
    tiktok?: string;
  };
  /**
   * Optional: store links for the app banner. Hidden entirely while unset,
   * which is why the homepage never renders an empty download block.
   */
  apps?: { android?: string; ios?: string };
  team: { members: TeamMember[]; structure: TeamSection[] };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Nav entries are used to build links, so an entry that arrives without a label
 * would be a link to nowhere — such entries are dropped rather than rendered.
 */
function navSection(value: unknown): NavSection {
  const raw = isRecord(value) ? value : {};
  const kind = raw["kind"];
  return {
    label: str(raw["label"]),
    kind:
      kind === "home" || kind === "index" || kind === "live" || kind === "category"
        ? kind
        : "category",
    category: str(raw["category"]),
    visible: bool(raw["visible"], true),
  };
}

/**
 * The API is an external boundary, and the type above is a claim about it
 * rather than a guarantee: a deployment running an older build answers with
 * settings sections this client has never heard of, and a partially written
 * row can be missing them entirely. Every section is therefore filled in here,
 * once, so no component has to defend itself against a missing one.
 */
export function normaliseSettings(input: unknown): SiteSettings {
  const raw = isRecord(input) ? input : {};
  const section = (key: string): Record<string, unknown> => {
    const value = raw[key];
    return isRecord(value) ? value : {};
  };

  const hero = section("hero");
  const ticker = section("ticker");
  const live = section("live");
  const schedule = section("schedule");
  const contact = section("contact");
  const social = section("social");
  const team = section("team");
  const nav = section("nav");
  const footer = section("footer");
  const apps = isRecord(raw["apps"]) ? raw["apps"] : null;

  const settings: SiteSettings = {
    hero: { slides: list<HeroSlide>(hero["slides"]) },
    ticker: { enabled: bool(ticker["enabled"], false), label: str(ticker["label"]) },
    live: {
      streamUrl: str(live["streamUrl"]),
      title: str(live["title"]),
      description: str(live["description"]),
      isLive: bool(live["isLive"], false),
      startedAt: str(live["startedAt"]),
      video: isRecord(live["video"]) ? (live["video"] as unknown as VideoDto) : null,
    },
    schedule: {
      image: str(schedule["image"]),
      title: str(schedule["title"]),
      caption: str(schedule["caption"]),
      note: str(schedule["note"]),
    },
    contact: {
      address: str(contact["address"]),
      phone: str(contact["phone"]),
      email: str(contact["email"]),
      whatsapp: str(contact["whatsapp"]),
    },
    social: {
      instagram: str(social["instagram"]),
      twitter: str(social["twitter"]),
      facebook: str(social["facebook"]),
      youtube: str(social["youtube"]),
    },
    team: {
      members: list<TeamMember>(team["members"]),
      structure: list<TeamSection>(team["structure"]),
    },
    nav: {
      sections: list<unknown>(nav["sections"])
        .map(navSection)
        .filter((s) => s.label !== ""),
    },
    footer: { note: str(footer["note"]), copyright: str(footer["copyright"]) },
  };

  // Optional extras stay absent unless the API really sends them, so the blocks
  // they drive stay hidden instead of rendering as empty shells.
  if (typeof social["tiktok"] === "string") settings.social.tiktok = social["tiktok"];
  if (apps) {
    const ios = str(apps["ios"]);
    const android = str(apps["android"]);
    if (ios) settings.apps = { ios };
    if (android) settings.apps = { ...settings.apps, android };
  }

  return settings;
}

export async function fetchSettings(): Promise<SiteSettings> {
  const payload = await getJson<{ data: unknown }>("/api/settings");
  return normaliseSettings(payload.data);
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

/**
 * A display name from a URL slug: "top-stories" reads as "Top Stories". Words
 * already in another script are left exactly as they are.
 */
export function titleCase(value: string): string {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function sectionLabelForSlug(settings: SiteSettings, slug: string): string {
  const match = settings.nav.sections.find(
    (section) => section.kind === "category" && slugifyLabel(section.label) === slug,
  );
  // The display name, never the raw slug.
  return match ? match.label : titleCase(slug);
}
