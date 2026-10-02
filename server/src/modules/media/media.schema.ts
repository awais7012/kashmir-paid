import { z } from "zod";

export const listMediaQuerySchema = z.object({
  kind: z.enum(["image", "video"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(60),
  offset: z.coerce.number().int().min(0).default(0),
});

export const mediaIdParamSchema = z.object({ id: z.string().uuid("A valid media id is required") });

// The browser measures images before uploading, so these arrive as form fields
// alongside the file. They are optional: the row is still valid without them.
export const uploadFieldsSchema = z.object({
  width: z.coerce.number().int().positive().max(20000).optional(),
  height: z.coerce.number().int().positive().max(20000).optional(),
});
