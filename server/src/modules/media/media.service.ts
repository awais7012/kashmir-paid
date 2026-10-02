import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { type MediaRow, media, stories } from "../../db/schema.js";
import { publicUrlFor, removeStoredFile } from "../../lib/storage.js";

export type MediaDto = {
  id: string;
  kind: "image" | "video";
  url: string;
  original_name: string;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

export function toMediaDto(row: MediaRow): MediaDto {
  return {
    id: row.id,
    kind: row.kind === "video" ? "video" : "image",
    url: row.url,
    original_name: row.originalName,
    mime: row.mime,
    size_bytes: row.sizeBytes,
    width: row.width,
    height: row.height,
    created_at: row.createdAt.toISOString(),
  };
}

export type CreateMediaInput = {
  filename: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdBy: string | null;
};

export async function createMedia(input: CreateMediaInput): Promise<MediaRow> {
  const id = crypto.randomUUID();

  await db.insert(media).values({
    id,
    kind: input.mime.startsWith("image/") ? "image" : "video",
    filename: input.filename,
    originalName: input.originalName.slice(0, 255),
    mime: input.mime,
    sizeBytes: input.sizeBytes,
    width: input.width,
    height: input.height,
    url: publicUrlFor(input.filename),
    createdBy: input.createdBy,
  });

  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw new Error("Media insert succeeded but the row could not be reloaded");
  return row;
}

export type ListMediaOptions = {
  kind?: "image" | "video" | undefined;
  limit: number;
  offset: number;
};

export function listMedia(options: ListMediaOptions): Promise<MediaRow[]> {
  const where = options.kind ? eq(media.kind, options.kind) : undefined;

  return db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(options.limit)
    .offset(options.offset);
}

export async function countMedia(kind?: "image" | "video"): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(media)
    .where(kind ? eq(media.kind, kind) : undefined);
  return rows[0]?.value ?? 0;
}

export async function getMediaById(id: string): Promise<MediaRow | null> {
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return rows[0] ?? null;
}

export type DeleteMediaOutcome =
  { status: "deleted" } | { status: "not_found" } | { status: "in_use"; storyTitle: string };

export async function deleteMedia(id: string): Promise<DeleteMediaOutcome> {
  const row = await getMediaById(id);
  if (!row) return { status: "not_found" };

  // Refuse to orphan a story that still points at this file.
  const imageUse = await db
    .select({ title: stories.title })
    .from(stories)
    .where(eq(stories.heroImageUrl, row.url))
    .limit(1);

  const videoUse = await db
    .select({ title: stories.title })
    .from(stories)
    .where(eq(stories.videoUrl, row.url))
    .limit(1);

  const inUse = imageUse[0] ?? videoUse[0];
  if (inUse) return { status: "in_use", storyTitle: inUse.title };

  await db.delete(media).where(eq(media.id, id));
  await removeStoredFile(row.filename);

  return { status: "deleted" };
}

export async function findMediaByUrl(url: string): Promise<MediaRow | null> {
  const rows = await db
    .select()
    .from(media)
    .where(and(eq(media.url, url), eq(media.kind, "video")))
    .limit(1);
  return rows[0] ?? null;
}
