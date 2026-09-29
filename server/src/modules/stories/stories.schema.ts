import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const storyFields = {
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugPattern, "Slug must be lowercase words separated by dashes")
    .max(191),
  category: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(255),
  summary: z.string().trim().min(1),
  author: z.string().trim().min(1).max(128),
  image_key: z.string().trim().min(1).max(64),
  featured: z.boolean(),
  display_order: z.number().int().min(0),
  published_at: z.coerce.date(),
};

export const createStorySchema = z.object({
  ...storyFields,
  featured: storyFields.featured.default(false),
  display_order: storyFields.display_order.default(0),
  published_at: storyFields.published_at.optional(),
});

export const updateStorySchema = z.object(storyFields).partial();

export const listStoriesQuerySchema = z.object({
  category: z.string().trim().min(1).max(64).optional(),
  featured: z.enum(["true", "false"]).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const storyIdParamSchema = z.object({ id: z.string().uuid("A valid story id is required") });
export const storySlugParamSchema = z.object({ slug: z.string().trim().min(1).max(191) });

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type ListStoriesQuery = z.infer<typeof listStoriesQuerySchema>;
