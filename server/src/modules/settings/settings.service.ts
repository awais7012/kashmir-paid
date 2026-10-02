import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { settings } from "../../db/schema.js";
import { parseVideoUrl } from "../../lib/video-url.js";
import {
  DEFAULT_SETTINGS,
  siteSettingsSchema,
  type SiteSettings,
  type UpdateSettingsInput,
} from "./settings.schema.js";

const SETTINGS_KEY = "site";

function mergeSection<T extends object>(current: T, patch: unknown): T {
  if (!patch || typeof patch !== "object") return current;
  return { ...current, ...(patch as Partial<T>) };
}

/** Stored data is merged over the defaults so a partial row still validates. */
function withDefaults(stored: unknown): SiteSettings {
  const raw = (stored && typeof stored === "object" ? stored : {}) as Partial<SiteSettings>;

  try {
    return siteSettingsSchema.parse({
      hero: { ...DEFAULT_SETTINGS.hero, ...raw.hero },
      ticker: { ...DEFAULT_SETTINGS.ticker, ...raw.ticker },
      live: { ...DEFAULT_SETTINGS.live, ...raw.live },
      nav: raw.nav?.sections?.length ? { sections: raw.nav.sections } : DEFAULT_SETTINGS.nav,
      footer: { ...DEFAULT_SETTINGS.footer, ...raw.footer },
    });
  } catch {
    // Corrupt or stale rows degrade to the shipped defaults rather than 500.
    return DEFAULT_SETTINGS;
  }
}

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEY)).limit(1);
  return withDefaults(rows[0]?.value);
}

function videoDto(rawUrl: string, title: string | null) {
  const parsed = parseVideoUrl(rawUrl);
  if (!parsed) return null;

  return {
    provider: parsed.provider,
    id: parsed.id,
    url: parsed.url,
    embed_url: parsed.embedUrl,
    thumbnail_url: parsed.thumbnailUrl,
    title,
    embeddable: parsed.embeddable,
  };
}

/**
 * Video links are parsed once here, so the site never needs its own copy of the
 * YouTube/Vimeo rules.
 */
export function withDerivedVideo<T extends SiteSettings>(value: T) {
  return {
    ...value,
    hero: {
      ...value.hero,
      video: videoDto(value.hero.videoUrl, null),
    },
    live: {
      ...value.live,
      video: videoDto(value.live.streamUrl, value.live.title || null),
    },
  };
}

export async function updateSettings(patch: UpdateSettingsInput): Promise<SiteSettings> {
  const current = await getSettings();

  const merged: SiteSettings = {
    hero: mergeSection(current.hero, patch.hero),
    ticker: mergeSection(current.ticker, patch.ticker),
    live: mergeSection(current.live, patch.live),
    nav: patch.nav ? { sections: patch.nav.sections } : current.nav,
    footer: mergeSection(current.footer, patch.footer),
  };

  // The broadcast clock is the server's to keep, so a client cannot backdate it.
  let startedAt = current.live.startedAt;
  if (patch.live?.isLive === true && !current.live.isLive) startedAt = new Date().toISOString();
  if (patch.live?.isLive === false) startedAt = "";
  merged.live = { ...merged.live, startedAt };

  // Throws ZodError for invalid values, which the error handler turns into a 422.
  const validated = siteSettingsSchema.parse(merged);

  await db
    .insert(settings)
    .values({ key: SETTINGS_KEY, value: validated })
    .onDuplicateKeyUpdate({ set: { value: validated, updatedAt: new Date() } });

  return validated;
}
