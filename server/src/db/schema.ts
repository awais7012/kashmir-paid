import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  datetime,
  index,
  int,
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
    author: varchar("author", { length: 128 }).notNull(),
    publishedAt: datetime("published_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    imageKey: varchar("image_key", { length: 64 }).notNull(),
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
export type AdminRow = typeof admins.$inferSelect;
export type NewAdminRow = typeof admins.$inferInsert;
