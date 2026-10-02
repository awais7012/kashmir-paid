import { z } from "zod";
import { parseVideoUrl, VIDEO_URL_HINT } from "../../lib/video-url.js";

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
  language: z.enum(["en", "ur"]),
  author: z.string().trim().min(1).max(128),
  image_key: z.enum(["lead", "artisan", "lake", "sport"]),
  featured: z.boolean(),
  display_order: z.number().int().min(0),
  published_at: z.coerce.date(),
  body: z.string().max(100_000),
  hero_image_url: z.string().trim().max(512),
  // Validated here so a bad link comes back as this field's error, with a hint.
  video_url: z
    .string()
    .trim()
    .max(512)
    .superRefine((value, ctx) => {
      if (value && !parseVideoUrl(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: VIDEO_URL_HINT });
      }
    }),
  video_title: z.string().trim().max(255),
};

export const createStorySchema = z.object({
  ...storyFields,
  language: storyFields.language.default("en"),
  image_key: storyFields.image_key.default("lead"),
  featured: storyFields.featured.default(false),
  display_order: storyFields.display_order.default(0),
  published_at: storyFields.published_at.optional(),
  body: storyFields.body.default(""),
  hero_image_url: storyFields.hero_image_url.default(""),
  video_url: storyFields.video_url.default(""),
  video_title: storyFields.video_title.default(""),
});

export const updateStorySchema = z.object(storyFields).partial();

export const listStoriesQuerySchema = z.object({
  category: z.string().trim().min(1).max(64).optional(),
  featured: z.enum(["true", "false"]).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  withVideo: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const storyIdParamSchema = z.object({ id: z.string().uuid("A valid story id is required") });
export const storySlugParamSchema = z.object({ slug: z.string().trim().min(1).max(191) });

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type ListStoriesQuery = z.infer<typeof listStoriesQuerySchema>;
