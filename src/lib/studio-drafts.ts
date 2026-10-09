const PREFIX = "gktv.studio.draft.";

export function draftKey(name: string): string {
  return `${PREFIX}${name}`;
}

/** Session storage keeps working drafts for the life of the tab only. */
export function saveDraft(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; failing to stash must not break saving.
    return;
  }
}

export function readDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Best-effort cleanup only.
    return;
  }
}
