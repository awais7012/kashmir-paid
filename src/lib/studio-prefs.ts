const KEY = "gktv.studio.prefs";

/**
 * Small conveniences the studio remembers between visits, so an editor does not
 * retype the same byline and section on every story.
 */
export type StudioPrefs = {
  author: string;
  category: string;
};

export function readStudioPrefs(): StudioPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioPrefs>;
    if (typeof parsed.author !== "string" || typeof parsed.category !== "string") return null;
    return { author: parsed.author, category: parsed.category };
  } catch {
    return null;
  }
}

export function saveStudioPrefs(prefs: StudioPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Storage can be blocked or full; remembering prefs is best-effort only.
    return;
  }
}
