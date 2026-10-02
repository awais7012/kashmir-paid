import { and, asc, count, desc, eq, isNotNull, like, lte, ne, or, type SQL } from "drizzle-orm";
import { db } from "../../db/client.js";
import { type NewStoryRow, type StoryRow, stories } from "../../db/schema.js";
import { parseVideoUrl } from "../../lib/video-url.js";
import type { CreateStoryInput, ListStoriesQuery, UpdateStoryInput } from "./stories.schema.js";

export type StoryVideoDto = {
  provider: string;
  id: string;
  url: string;
  embed_url: string;
  thumbnail_url: string | null;
  title: string | null;
  embeddable: boolean;
};

/** Light shape for cards and lists. */
export type StoryDto = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  /** "en" or "ur"; the site renders "ur" right-to-left. */
  language: string;
  author: string;
  published_at: string;
  image_key: string;
  hero_image_url: string | null;
  has_video: boolean;
  featured: boolean;
  display_order: number;
};

/** Adds the fields only the article page needs. */
export type StoryDetailDto = StoryDto & {
  body: string | null;
  video: StoryVideoDto | null;
};

function buildVideo(row: StoryRow): StoryVideoDto | null {
  if (!row.videoUrl) return null;

  const parsed = parseVideoUrl(row.videoUrl);
  if (!parsed) return null;

  return {
    provider: parsed.provider,
    id: parsed.id,
    url: parsed.url,
    embed_url: parsed.embedUrl,
    thumbnail_url: parsed.thumbnailUrl,
    title: row.videoTitle,
    embeddable: parsed.embeddable,
  };
}

export function toStoryDto(row: StoryRow): StoryDto {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    summary: row.summary,
    language: row.language,
    author: row.author,
    published_at: row.publishedAt.toISOString(),
    image_key: row.imageKey,
    hero_image_url: row.heroImageUrl,
    has_video: Boolean(row.videoUrl),
    featured: row.featured,
    display_order: row.displayOrder,
  };
}

export function toStoryDetailDto(row: StoryRow): StoryDetailDto {
  return {
    ...toStoryDto(row),
    body: row.body,
    video: buildVideo(row),
  };
}

type ListOptions = {
  includeUnpublished?: boolean;
};

function buildConditions(query: ListStoriesQuery, options: ListOptions): SQL[] {
  const conditions: SQL[] = [];

  if (!options.includeUnpublished) {
    conditions.push(lte(stories.publishedAt, new Date()));
  }

  if (query.category) {
    conditions.push(like(stories.category, query.category));
  }

  if (query.featured) {
    conditions.push(eq(stories.featured, query.featured === "true"));
  }

  if (query.withVideo === "true") {
    conditions.push(isNotNull(stories.videoUrl));
  }

  if (query.q) {
    const term = `%${query.q}%`;
    const search = or(
      like(stories.title, term),
      like(stories.summary, term),
      like(stories.category, term),
      like(stories.author, term),
    );
    if (search) {
      conditions.push(search);
    }
  }

  return conditions;
}

function withFilters(conditions: SQL[]): SQL | undefined {
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function listStories(
  query: ListStoriesQuery,
  options: ListOptions = {},
): Promise<StoryRow[]> {
  return db
    .select()
    .from(stories)
    .where(withFilters(buildConditions(query, options)))
    .orderBy(desc(stories.featured), asc(stories.displayOrder), desc(stories.publishedAt))
    .limit(query.limit)
    .offset(query.offset);
}

export async function countStories(
  query: ListStoriesQuery,
  options: ListOptions = {},
): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(stories)
    .where(withFilters(buildConditions(query, options)));

  return rows[0]?.value ?? 0;
}

export async function listCategories(includeUnpublished = false): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: stories.category })
    .from(stories)
    .where(includeUnpublished ? undefined : lte(stories.publishedAt, new Date()))
    .orderBy(asc(stories.category));

  return rows.map((row) => row.category);
}

export async function getPublishedStoryBySlug(slug: string): Promise<StoryRow | null> {
  const rows = await db
    .select()
    .from(stories)
    .where(and(eq(stories.slug, slug), lte(stories.publishedAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

export async function getStoryBySlug(slug: string): Promise<StoryRow | null> {
  const rows = await db.select().from(stories).where(eq(stories.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getStoryById(id: string): Promise<StoryRow | null> {
  const rows = await db.select().from(stories).where(eq(stories.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Empty strings from the form mean "not set", and video links are normalised. */
function videoColumns(rawUrl: string): Pick<NewStoryRow, "videoUrl" | "videoProvider" | "videoId"> {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { videoUrl: null, videoProvider: null, videoId: null };

  const parsed = parseVideoUrl(trimmed);
  if (!parsed) return { videoUrl: null, videoProvider: null, videoId: null };

  return { videoUrl: parsed.url, videoProvider: parsed.provider, videoId: parsed.id };
}

function textOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * The homepage hero is a single story, so featuring one has to clear the rest.
 * Without this, ticking "Featured" on two stories silently keeps only the first.
 */
async function clearOtherFeatured(keepId: string): Promise<void> {
  await db
    .update(stories)
    .set({ featured: false })
    .where(and(eq(stories.featured, true), ne(stories.id, keepId)));
}

export async function createStory(input: CreateStoryInput): Promise<StoryRow> {
  const id = crypto.randomUUID();

  const values: NewStoryRow = {
    id,
    slug: input.slug,
    category: input.category,
    title: input.title,
    summary: input.summary,
    language: input.language,
    body: textOrNull(input.body),
    author: input.author,
    imageKey: input.image_key,
    heroImageUrl: textOrNull(input.hero_image_url),
    videoTitle: textOrNull(input.video_title),
    featured: input.featured,
    displayOrder: input.display_order,
    ...videoColumns(input.video_url),
    ...(input.published_at ? { publishedAt: input.published_at } : {}),
  };

  await db.insert(stories).values(values);

  if (input.featured) {
    await clearOtherFeatured(id);
  }

  const row = await getStoryById(id);
  if (!row) {
    throw new Error("Story insert succeeded but the row could not be reloaded");
  }

  return row;
}

export async function updateStory(id: string, input: UpdateStoryInput): Promise<StoryRow | null> {
  const existing = await getStoryById(id);
  if (!existing) {
    return null;
  }

  const patch: Partial<NewStoryRow> = {};

  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.category !== undefined) patch.category = input.category;
  if (input.title !== undefined) patch.title = input.title;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.language !== undefined) patch.language = input.language;
  if (input.body !== undefined) patch.body = textOrNull(input.body);
  if (input.author !== undefined) patch.author = input.author;
  if (input.image_key !== undefined) patch.imageKey = input.image_key;
  if (input.hero_image_url !== undefined) patch.heroImageUrl = textOrNull(input.hero_image_url);
  if (input.video_title !== undefined) patch.videoTitle = textOrNull(input.video_title);
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.display_order !== undefined) patch.displayOrder = input.display_order;
  if (input.published_at !== undefined) patch.publishedAt = input.published_at;
  if (input.video_url !== undefined) Object.assign(patch, videoColumns(input.video_url));

  if (Object.keys(patch).length === 0) {
    return existing;
  }

  patch.updatedAt = new Date();
  await db.update(stories).set(patch).where(eq(stories.id, id));

  if (input.featured === true) {
    await clearOtherFeatured(id);
  }

  return getStoryById(id);
}

export async function deleteStory(id: string): Promise<boolean> {
  const result = await db.delete(stories).where(eq(stories.id, id));
  return (result[0]?.affectedRows ?? 0) > 0;
}
