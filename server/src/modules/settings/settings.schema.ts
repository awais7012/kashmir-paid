import { z } from "zod";
import { parseVideoUrl, STREAM_URL_HINT, VIDEO_URL_HINT } from "../../lib/video-url.js";

export const SECTION_LIMIT = 20;

const navSectionSchema = z.object({
  label: z.string().trim().min(1).max(40),
  // home = the homepage, index = all stories, live = the broadcast page,
  // category = a page listing one story category.
  kind: z.enum(["home", "index", "live", "category"]),
  category: z.string().trim().max(64).default(""),
  visible: z.boolean().default(true),
});

export const siteSettingsSchema = z.object({
  hero: z.object({
    eyebrow: z.string().trim().max(80),
    headline: z.string().trim().max(120),
    accent: z.string().trim().max(120),
    primaryCta: z.string().trim().max(40),
    secondaryCta: z.string().trim().max(40),
    // An uploaded hero image wins over the featured story's cover.
    image: z.string().trim().max(512),
    videoUrl: z
      .string()
      .trim()
      .max(512)
      .superRefine((value, ctx) => {
        if (value && !parseVideoUrl(value)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: VIDEO_URL_HINT });
        }
      }),
  }),
  ticker: z.object({
    enabled: z.boolean(),
    label: z.string().trim().max(40),
  }),
  live: z.object({
    // Validated like any other video link: a stream the panel cannot render is
    // worse than a rejection, because the live page would silently show off-air.
    streamUrl: z
      .string()
      .trim()
      .max(500)
      .superRefine((value, ctx) => {
        if (value && !parseVideoUrl(value)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: STREAM_URL_HINT });
        }
      }),
    title: z.string().trim().max(160),
    description: z.string().trim().max(400),
    isLive: z.boolean(),
    /** Set by the server when the broadcast starts, cleared when it ends. */
    startedAt: z.string().trim().max(40),
  }),
  nav: z.object({
    sections: z.array(navSectionSchema).max(SECTION_LIMIT),
  }),
  footer: z.object({
    note: z.string().trim().max(200),
    copyright: z.string().trim().max(120),
  }),
});

export const updateSettingsSchema = z.object({
  hero: siteSettingsSchema.shape.hero.partial().optional(),
  ticker: siteSettingsSchema.shape.ticker.partial().optional(),
  live: siteSettingsSchema.shape.live.partial().optional(),
  nav: z.object({ sections: z.array(navSectionSchema).max(SECTION_LIMIT) }).optional(),
  footer: siteSettingsSchema.shape.footer.partial().optional(),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const navSectionPublicSchema = navSectionSchema;

// Mirrors the copy the site shipped with, so nothing changes until it is edited.
export const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    eyebrow: "Breaking report",
    headline: "Kashmir,",
    accent: "connected.",
    primaryCta: "Watch live",
    secondaryCta: "Explore GKTV",
    image: "",
    videoUrl: "",
  },
  ticker: {
    enabled: true,
    label: "Breaking",
  },
  live: {
    streamUrl: "",
    title: "The Valley Report",
    description: "Watch Global Kashmir TV live from the valley.",
    isLive: false,
    startedAt: "",
  },
  nav: {
    sections: [
      { label: "Home", kind: "home", category: "", visible: true },
      { label: "News", kind: "index", category: "", visible: true },
      { label: "Kashmir", kind: "category", category: "Kashmir", visible: true },
      { label: "Pakistan", kind: "category", category: "Pakistan", visible: true },
      { label: "World", kind: "category", category: "World", visible: true },
      { label: "Live", kind: "live", category: "", visible: true },
      { label: "Shows", kind: "category", category: "Shows", visible: true },
      { label: "Videos", kind: "category", category: "Videos", visible: true },
      { label: "Tourism", kind: "category", category: "Tourism", visible: true },
      { label: "Sports", kind: "category", category: "Sports", visible: true },
      { label: "Heritage", kind: "category", category: "Heritage", visible: true },
      { label: "Library", kind: "category", category: "Library", visible: true },
    ],
  },
  footer: {
    note: "Independent voices · Global perspective",
    copyright: "© 2026 Global Kashmir TV",
  },
};
