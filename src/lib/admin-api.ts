import type { SiteSettings } from "@/lib/site-settings";
import { API_BASE_URL } from "@/lib/stories";
import type { StoryLanguage } from "@/lib/story-language";

const TOKEN_KEY = "gktv.studio.token";
const ADMIN_KEY = "gktv.studio.admin";
const REQUEST_TIMEOUT_MS = 15000;

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AdminStoryVideo = {
  provider: string;
  id: string;
  url: string;
  embed_url: string;
  thumbnail_url: string | null;
  title: string | null;
};

export type AdminStory = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  language: StoryLanguage;
  author: string;
  published_at: string;
  image_key: string;
  hero_image_url: string | null;
  hero_thumb_url: string | null;
  has_video: boolean;
  video: AdminStoryVideo | null;
  body: string | null;
  featured: boolean;
  display_order: number;
};

export type StoryDraft = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  language: StoryLanguage;
  author: string;
  image_key: string;
  featured: boolean;
  display_order: number;
  published_at?: string;
  body: string;
  hero_image_url: string;
  video_url: string;
  video_title: string;
};

export type MediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  thumb_url: string | null;
  original_name: string;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

export type SettingsPatch = {
  hero?: Partial<SiteSettings["hero"]>;
  ticker?: Partial<SiteSettings["ticker"]>;
  live?: Partial<Omit<SiteSettings["live"], "video">>;
  nav?: { sections: SiteSettings["nav"]["sections"] };
  footer?: Partial<SiteSettings["footer"]>;
};

export type FieldErrors = Record<string, string[]>;

type ErrorEnvelope = {
  error?: {
    message?: string;
    details?: { fieldErrors?: FieldErrors; formErrors?: string[] };
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;
  readonly formErrors: string[];

  constructor(
    status: number,
    message: string,
    fieldErrors: FieldErrors = {},
    formErrors: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.formErrors = formErrors;
  }
}

function errorFrom(status: number, payload: unknown, fallback: string): ApiError {
  const envelope = (payload as ErrorEnvelope | undefined)?.error;
  return new ApiError(
    status,
    envelope?.message ?? fallback,
    envelope?.details?.fieldErrors ?? {},
    envelope?.details?.formErrors ?? [],
  );
}

// localStorage is unavailable during SSR, so every access is guarded.
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getToken(): string | null {
  return store()?.getItem(TOKEN_KEY) ?? null;
}

export function getStoredAdmin(): AdminUser | null {
  const raw = store()?.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, admin: AdminUser): void {
  const storage = store();
  if (!storage) return;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearSession(): void {
  const storage = store();
  if (!storage) return;
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(ADMIN_KEY);
}

async function requestRaw<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set("content-type", "application/json");

  if (options.auth) {
    const token = getToken();
    if (!token) throw new ApiError(401, "Your session has ended. Sign in again.");
    headers.set("authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the API at ${API_BASE_URL}. Is the backend running?`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw errorFrom(response.status, payload, `Request failed (HTTP ${response.status})`);
  }

  return payload as T;
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ token: string; admin: AdminUser }> {
  const payload = await requestRaw<{ data: { token: string; admin: AdminUser } }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
  return payload.data;
}

export async function fetchCurrentAdmin(): Promise<AdminUser> {
  const payload = await requestRaw<{ data: AdminUser }>("/api/auth/me", {}, { auth: true });
  return payload.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await requestRaw<void>(
    "/api/auth/password",
    { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) },
    { auth: true },
  );
}

export async function fetchStories(): Promise<{ data: AdminStory[]; meta: { total: number } }> {
  return requestRaw<{ data: AdminStory[]; meta: { total: number } }>(
    "/api/admin/stories?limit=100",
    {},
    { auth: true },
  );
}

export async function fetchStory(id: string): Promise<AdminStory> {
  const payload = await requestRaw<{ data: AdminStory }>(
    `/api/admin/stories/${encodeURIComponent(id)}`,
    {},
    { auth: true },
  );
  return payload.data;
}

export async function createStory(draft: StoryDraft): Promise<AdminStory> {
  const payload = await requestRaw<{ data: AdminStory }>(
    "/api/admin/stories",
    { method: "POST", body: JSON.stringify(draft) },
    { auth: true },
  );
  return payload.data;
}

export async function updateStory(id: string, draft: Partial<StoryDraft>): Promise<AdminStory> {
  const payload = await requestRaw<{ data: AdminStory }>(
    `/api/admin/stories/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(draft) },
    { auth: true },
  );
  return payload.data;
}

export async function deleteStory(id: string): Promise<void> {
  await requestRaw<void>(
    `/api/admin/stories/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    { auth: true },
  );
}

export async function fetchMedia(params: { kind?: "image" | "video" } = {}): Promise<{
  data: MediaItem[];
  meta: { total: number };
}> {
  const search = new URLSearchParams({ limit: "200" });
  if (params.kind) search.set("kind", params.kind);

  return requestRaw<{ data: MediaItem[]; meta: { total: number } }>(
    `/api/admin/media?${search.toString()}`,
    {},
    { auth: true },
  );
}

export async function deleteMedia(id: string): Promise<void> {
  await requestRaw<void>(
    `/api/admin/media/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    { auth: true },
  );
}

/**
 * Uploads through XMLHttpRequest because fetch cannot report upload progress,
 * and a large video must not be killed by the usual request timeout.
 */
export function uploadMedia(
  file: File,
  options: { onProgress?: (percent: number) => void; width?: number; height?: number } = {},
): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    if (!token) {
      reject(new ApiError(401, "Your session has ended. Sign in again."));
      return;
    }

    const form = new FormData();
    form.append("file", file);
    if (options.width) form.append("width", String(options.width));
    if (options.height) form.append("height", String(options.height));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/admin/media`);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let payload: unknown;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = undefined;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((payload as { data: MediaItem }).data);
        return;
      }

      reject(errorFrom(xhr.status, payload, `Upload failed (HTTP ${xhr.status})`));
    };

    xhr.onerror = () => reject(new ApiError(0, "Upload failed. Is the API running?"));
    xhr.send(form);
  });
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  const payload = await requestRaw<{ data: SiteSettings }>(
    "/api/admin/settings",
    {},
    { auth: true },
  );
  return payload.data;
}

export async function saveSettings(patch: SettingsPatch): Promise<SiteSettings> {
  const payload = await requestRaw<{ data: SiteSettings }>(
    "/api/admin/settings",
    { method: "PUT", body: JSON.stringify(patch) },
    { auth: true },
  );
  return payload.data;
}
