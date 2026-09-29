import { and, asc, count, desc, eq, like, lte, or, type SQL } from "drizzle-orm";
import { db } from "../../db/client.js";
import { type NewStoryRow, type StoryRow, stories } from "../../db/schema.js";
import type { CreateStoryInput, ListStoriesQuery, UpdateStoryInput } from "./stories.schema.js";

export type StoryDto = {
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

export function toStoryDto(row: StoryRow): StoryDto {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    summary: row.summary,
    author: row.author,
    published_at: row.publishedAt.toISOString(),
    image_key: row.imageKey,
    featured: row.featured,
    display_order: row.displayOrder,
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
    conditions.push(eq(stories.category, query.category));
  }

  if (query.featured) {
    conditions.push(eq(stories.featured, query.featured === "true"));
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

export async function listCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: stories.category })
    .from(stories)
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

export async function createStory(input: CreateStoryInput): Promise<StoryRow> {
  const id = crypto.randomUUID();

  const values: NewStoryRow = {
    id,
    slug: input.slug,
    category: input.category,
    title: input.title,
    summary: input.summary,
    author: input.author,
    imageKey: input.image_key,
    featured: input.featured,
    displayOrder: input.display_order,
    ...(input.published_at ? { publishedAt: input.published_at } : {}),
  };

  await db.insert(stories).values(values);

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
  if (input.author !== undefined) patch.author = input.author;
  if (input.image_key !== undefined) patch.imageKey = input.image_key;
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.display_order !== undefined) patch.displayOrder = input.display_order;
  if (input.published_at !== undefined) patch.publishedAt = input.published_at;

  if (Object.keys(patch).length === 0) {
    return existing;
  }

  patch.updatedAt = new Date();
  await db.update(stories).set(patch).where(eq(stories.id, id));

  return getStoryById(id);
}

export async function deleteStory(id: string): Promise<boolean> {
  const result = await db.delete(stories).where(eq(stories.id, id));
  return (result[0]?.affectedRows ?? 0) > 0;
}
