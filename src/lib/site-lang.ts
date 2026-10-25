import type { StoryLanguage } from "@/lib/story-language";

/**
 * The language this deployment publishes in — one language per deployment, and
 * no switch on the site. Every list reads through `forSiteLang`, so a bilingual
 * archive still renders as a single-language publication.
 *
 * The value is inlined at build time from `SITE_LANG` (see vite.config.ts), so
 * the server and the browser always agree. The runtime environment is also read
 * on the server, so a built server can be pointed at a language without a
 * rebuild.
 */
declare const __SITE_LANG__: string | undefined;

function readEnv(): string | undefined {
  const inlined = typeof __SITE_LANG__ === "string" ? __SITE_LANG__ : undefined;
  if (inlined) return inlined;

  // SSR only: lets the built server be switched at runtime.
  const nodeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process;
  return nodeProcess?.env?.["SITE_LANG"] ?? nodeProcess?.env?.["VITE_SITE_LANG"];
}

function parse(value: string | undefined): StoryLanguage {
  return (value ?? "en").trim().toLowerCase().startsWith("ur") ? "ur" : "en";
}

export const SITE_LANG: StoryLanguage = parse(readEnv());

export const IS_URDU_SITE = SITE_LANG === "ur";

/** Keep only the stories written in this deployment's language. */
export function forSiteLang<T extends { language: string }>(stories: T[]): T[] {
  return stories.filter((story) => story.language === SITE_LANG);
}
