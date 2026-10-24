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

/**
 * One frame of the homepage slider. The editor uploads a full picture or a
 * video; there is no headline or button copy laid over it any more. A slide
 * with a link is an advert: clicking it opens the advertiser's page.
 */
const heroSlideSchema = z
  .object({
    url: z.string().trim().max(512),
    kind: z.enum(["image", "video"]).default("image"),
    link: z.string().trim().max(512).default(""),
  })
  .superRefine((slide, ctx) => {
    if (!slide.link) return;
    try {
      const parsed = new URL(slide.link);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return;
    } catch {
      // Falls through to the issue below.
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["link"],
      message: "Use a full web address starting with https://",
    });
  });

/** A person on the Team page. Photos are uploaded through the media library. */
const teamMemberSchema = z.object({
  // Stable key so the studio's list editor can reorder rows without losing focus.
  id: z.string().trim().max(64).default(""),
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(800).default(""),
  photo: z.string().trim().max(512).default(""),
});

/**
 * One block of the published org chart. Roles are plain lines, and a line may
 * carry its own detail after a dash, e.g. "Director of News — editors".
 */
const teamSectionSchema = z.object({
  id: z.string().trim().max(64).default(""),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(400).default(""),
  roles: z.array(z.string().trim().min(1).max(300)).max(40).default([]),
});

export const siteSettingsSchema = z.object({
  hero: z.object({
    slides: z.array(heroSlideSchema).max(20),
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
  schedule: z.object({
    /** Uploaded picture of the programme schedule. Shown as-is on /schedule. */
    image: z.string().trim().max(512),
    title: z.string().trim().max(120),
    /** Sits under the title, e.g. "W.E.F. 6 October 2026". */
    caption: z.string().trim().max(160),
    note: z.string().trim().max(400),
  }),
  contact: z.object({
    address: z.string().trim().max(300),
    phone: z.string().trim().max(60),
    email: z.string().trim().max(160),
    whatsapp: z.string().trim().max(60),
  }),
  social: z.object({
    instagram: z.string().trim().max(300),
    twitter: z.string().trim().max(300),
    facebook: z.string().trim().max(300),
    youtube: z.string().trim().max(300),
  }),
  team: z.object({
    members: z.array(teamMemberSchema).max(60),
    structure: z.array(teamSectionSchema).max(24),
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
  schedule: siteSettingsSchema.shape.schedule.partial().optional(),
  contact: siteSettingsSchema.shape.contact.partial().optional(),
  social: siteSettingsSchema.shape.social.partial().optional(),
  team: siteSettingsSchema.shape.team.partial().optional(),
  nav: z.object({ sections: z.array(navSectionSchema).max(SECTION_LIMIT) }).optional(),
  footer: siteSettingsSchema.shape.footer.partial().optional(),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const navSectionPublicSchema = navSectionSchema;

// Mirrors the copy the site shipped with, so nothing changes until it is edited.
export const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    slides: [],
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
  schedule: {
    image: "",
    title: "Programme Schedule",
    caption: "",
    note: "",
  },
  contact: {
    address: "",
    phone: "",
    email: "",
    whatsapp: "",
  },
  social: {
    instagram: "",
    twitter: "",
    facebook: "",
    youtube: "",
  },
  team: {
    // Only confirmed appointments carry a name. Everyone else is published as a
    // position under the structure below, in line with the publication policy.
    members: [
      {
        id: "chairman",
        name: "Vincent Lyn",
        role: "Chairman",
        bio: "",
        photo: "",
      },
      {
        id: "ceo",
        name: "Raja Ejaz Ahmed Khan",
        role: "Chief Executive Officer",
        bio: "Executive leadership and international operations.",
        photo: "",
      },
    ],
    structure: [
      {
        id: "governance",
        title: "Leadership & Governance",
        description: "Institutional governance and strategic oversight.",
        roles: ["Governing Body / Board of Directors"],
      },
      {
        id: "executive",
        title: "Executive Management",
        description:
          "These departments report to the CEO and coordinate operations across all regional offices.",
        roles: [
          "Director of News & Editorial — News Editor, Assignment Editor, Fact-Checking and Editorial Team",
          "Director of Programmes & Production — Programme Managers, Producers, Presenters, Researchers and Video Editors",
          "Director of International Operations — Regional coordination and international bureau management",
          "Director of Digital Media & Technology — Website, Social Media, Graphics, Digital Publishing and Technical Operations",
          "Director of Marketing & Partnerships — Advertising, Sponsorships, Public Relations and Institutional Partnerships",
          "Director of Administration & Finance — Administration, Human Resources, Budgeting and Financial Management",
        ],
      },
      {
        id: "regional",
        title: "International Regional Structure",
        description:
          "Bureau chiefs and correspondents across Pakistan, Azad Jammu & Kashmir, the United Kingdom and Saudi Arabia.",
        roles: [
          "Head of Pakistan Operations — Bureau chiefs in Islamabad, Lahore and Karachi; regional reporters and correspondents",
          "Head of Azad Jammu & Kashmir Operations — Bureau chiefs in Muzaffarabad, Mirpur and Rawalakot / Poonch; district correspondents and field reporters",
          "Head of United Kingdom Operations — Bureau chiefs in London and Peterborough / Midlands; UK community correspondents; local news and events team",
          "Head of Saudi Arabia Operations — Bureau chiefs in Riyadh and Jeddah / Makkah; Gulf correspondents; Hajj, Umrah and community affairs team",
        ],
      },
      {
        id: "bureau",
        title: "Bureau-Level Team Structure",
        description:
          "Every regional bureau follows this reporting structure, adapted to its size and staffing.",
        roles: [
          "Regional Head",
          "Bureau Chief",
          "Senior Reporter / Correspondent",
          "Video Journalist / Digital Producer",
        ],
      },
    ],
  },
  nav: {
    sections: [
      { label: "Home", kind: "home", category: "", visible: true },
      { label: "News", kind: "index", category: "", visible: true },
      { label: "Live", kind: "live", category: "", visible: true },
    ],
  },
  footer: {
    note: "Independent voices · Global perspective",
    copyright: "© 2026 Global Kashmir TV",
  },
};
