import {
  queryOptions,
  type FetchQueryOptions,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { StoryLanguage } from "@/lib/story-language";

export type Story = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  /** "en" or "ur"; Urdu stories render right-to-left. */
  language: StoryLanguage;
  author: string;
  published_at: string;
  image_key: string;
  hero_image_url: string | null;
  has_video: boolean;
  featured: boolean;
  display_order: number;
};

export type StoryVideo = {
  provider: string;
  id: string;
  url: string;
  embed_url: string;
  thumbnail_url: string | null;
  title: string | null;
  embeddable: boolean;
};

export type StoryDetail = Story & {
  body: string | null;
  video: StoryVideo | null;
};

export type StoryListPage = {
  data: Story[];
  meta: { total: number; limit: number; offset: number };
};

export class StoryFetchError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "StoryFetchError";
    this.status = status;
  }
}

function readEnv(key: string): string | undefined {
  const viteEnv = import.meta.env as Record<string, string | undefined>;
  if (viteEnv[key]) return viteEnv[key];

  // SSR only: lets the built server be pointed at an API at runtime.
  const nodeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process;
  return nodeProcess?.env?.[key];
}

export const API_BASE_URL = (readEnv("VITE_API_URL") ?? "http://localhost:4000").replace(
  /\/+$/,
  "",
);

// A hung API must not hang the server render; a timeout counts as a failure.
const API_TIMEOUT_MS = 10_000;

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new StoryFetchError(response.status, `Request failed (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

/**
 * A 4xx is the API's real answer (a missing story, a malformed slug), so asking
 * again cannot help. Everything else, a 5xx, a timeout or an unreachable API,
 * is worth waiting out.
 */
export function isFinalApiError(error: unknown): boolean {
  return (
    error instanceof StoryFetchError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 408 &&
    error.status !== 429
  );
}

/**
 * Public pages wait for the API rather than fail: the page shows its skeleton
 * and the query keeps retrying, backing off to one attempt every 8 seconds.
 */
export const waitForApi = {
  retry: (_failureCount: number, error: Error) => !isFinalApiError(error),
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
  // The server render has just fetched this, so the browser need not ask again on open.
  staleTime: 30_000,
};

/**
 * Loader-side fetch: a single attempt that resolves to undefined when the API
 * is down, so the route still renders (as a skeleton) and the browser takes
 * over the retrying. Only a final answer such as a 404 is rethrown.
 */
export async function primeQuery<TData, TKey extends QueryKey>(
  queryClient: QueryClient,
  options: FetchQueryOptions<TData, Error, TData, TKey>,
): Promise<TData | undefined> {
  // Already retrying in the browser; waiting on it would stall the navigation.
  const state = queryClient.getQueryState<TData>(options.queryKey);
  if (state && state.fetchStatus !== "idle") return state.data;

  try {
    return await queryClient.ensureQueryData({ ...options, retry: false });
  } catch (error) {
    if (isFinalApiError(error)) throw error;
    return undefined;
  }
}

/** The homepage feed: every published story. */
export const storiesQueryOptions = queryOptions({
  queryKey: ["stories", "published"],
  queryFn: async (): Promise<Story[]> => (await getJson<StoryListPage>("/api/stories")).data,
  ...waitForApi,
});

/** The full index at /news. */
export const allStoriesQueryOptions = queryOptions({
  queryKey: ["stories", "index"],
  queryFn: (): Promise<StoryListPage> => getJson<StoryListPage>("/api/stories?limit=60"),
  ...waitForApi,
});

export function storiesByCategoryQueryOptions(category: string) {
  return queryOptions({
    queryKey: ["stories", "category", category],
    queryFn: (): Promise<StoryListPage> =>
      getJson<StoryListPage>(`/api/stories?limit=60&category=${encodeURIComponent(category)}`),
    ...waitForApi,
  });
}

export function storyQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["story", slug],
    queryFn: async (): Promise<StoryDetail> => {
      const payload = await getJson<{ data: StoryDetail }>(
        `/api/stories/${encodeURIComponent(slug)}`,
      );
      return payload.data;
    },
    ...waitForApi,
  });
}
