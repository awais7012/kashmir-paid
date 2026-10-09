import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  int,
  json,
  mediumtext,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const stories = mysqlTable(
  "stories",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: varchar("slug", { length: 191 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary").notNull(),
    // "en" or "ur". The site renders "ur" right-to-left in an Urdu typeface.
    language: varchar("language", { length: 8 }).notNull().default("en"),
    body: mediumtext("body"),
    author: varchar("author", { length: 128 }).notNull(),
    publishedAt: datetime("published_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    // Bundled fallback artwork; hero_image_url wins when an upload exists.
    imageKey: varchar("image_key", { length: 64 }).notNull().default("lead"),
    heroImageUrl: varchar("hero_image_url", { length: 512 }),
    videoUrl: varchar("video_url", { length: 512 }),
    videoProvider: varchar("video_provider", { length: 32 }),
    videoId: varchar("video_id", { length: 255 }),
    videoTitle: varchar("video_title", { length: 255 }),
    featured: boolean("featured").notNull().default(false),
    displayOrder: int("display_order").notNull().default(0),
    createdAt: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("stories_slug_uq").on(table.slug),
    index("stories_order_idx").on(table.featured, table.displayOrder, table.publishedAt),
    index("stories_category_idx").on(table.category, table.publishedAt),
  ],
);

export const media = mysqlTable(
  "media",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kind: varchar("kind", { length: 16 }).notNull(),
    // Relative path inside the upload root, e.g. 2026/09/<uuid>.jpg
    filename: varchar("filename", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mime: varchar("mime", { length: 127 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: int("width"),
    height: int("height"),
    url: varchar("url", { length: 512 }).notNull(),
    // Smaller copy of an uploaded image; null for videos, GIFs and small images.
    thumbUrl: varchar("thumb_url", { length: 512 }),
    createdBy: char("created_by", { length: 36 }),
    createdAt: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    uniqueIndex("media_filename_uq").on(table.filename),
    index("media_created_idx").on(table.createdAt),
    index("media_kind_idx").on(table.kind, table.createdAt),
  ],
);

// Single row, key "site". Values are validated against a Zod schema with
// defaults, so a missing or corrupt row still yields a complete settings object.
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: datetime("updated_at", { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdate(() => new Date()),
});

export const admins = mysqlTable(
  "admins",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: varchar("email", { length: 191 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 }).notNull().default("admin"),
    createdAt: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [uniqueIndex("admins_email_uq").on(table.email)],
);

export type StoryRow = typeof stories.$inferSelect;
export type NewStoryRow = typeof stories.$inferInsert;
export type MediaRow = typeof media.$inferSelect;
export type NewMediaRow = typeof media.$inferInsert;
export type AdminRow = typeof admins.$inferSelect;
export type NewAdminRow = typeof admins.$inferInsert;
