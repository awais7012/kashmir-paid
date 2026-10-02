import { queryOptions } from "@tanstack/react-query";
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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new StoryFetchError(response.status, `Request failed (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

/** The homepage feed: every published story. */
export const storiesQueryOptions = queryOptions({
  queryKey: ["stories", "published"],
  queryFn: async (): Promise<Story[]> => (await getJson<StoryListPage>("/api/stories")).data,
});

/** The full index at /news. */
export const allStoriesQueryOptions = queryOptions({
  queryKey: ["stories", "index"],
  queryFn: (): Promise<StoryListPage> => getJson<StoryListPage>("/api/stories?limit=60"),
});

export function storiesByCategoryQueryOptions(category: string) {
  return queryOptions({
    queryKey: ["stories", "category", category],
    queryFn: (): Promise<StoryListPage> =>
      getJson<StoryListPage>(`/api/stories?limit=60&category=${encodeURIComponent(category)}`),
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
  });
}
