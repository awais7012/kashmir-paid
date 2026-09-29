import { queryOptions } from "@tanstack/react-query";

export type Story = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  author: string;
  published_at: string;
  image_key: string;
  featured: boolean;
  display_order: number;
};

type StoriesResponse = {
  data: Story[];
  meta: { total: number; limit: number; offset: number };
};

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

export const storiesQueryOptions = queryOptions({
  queryKey: ["stories", "published"],
  queryFn: async (): Promise<Story[]> => {
    const response = await fetch(`${API_BASE_URL}/api/stories`);

    if (!response.ok) {
      throw new Error(`Failed to load stories (HTTP ${response.status})`);
    }

    const payload = (await response.json()) as StoriesResponse;
    return payload.data;
  },
});
