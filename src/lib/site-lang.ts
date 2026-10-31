import type { StoryLanguage } from "@/lib/story-language";

/** The default language for first-time visitors, configurable per deployment. */
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

/** Keep only stories written in the visitor's selected language. */
export function forSiteLang<T extends { language: string }>(
  stories: T[],
  language: StoryLanguage = SITE_LANG,
): T[] {
  return stories.filter((story) => story.language === language);
}
