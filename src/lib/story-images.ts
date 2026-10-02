import artisanImage from "@/assets/kashmir-artisan.jpg";
import lakeImage from "@/assets/dal-lake.jpg";
import leadImage from "@/assets/kashmir-lead.jpg";
import sportImage from "@/assets/kashmir-sport.jpg";

export const STORY_IMAGE_KEYS = ["lead", "artisan", "lake", "sport"] as const;

export type StoryImageKey = (typeof STORY_IMAGE_KEYS)[number];

const images: Record<StoryImageKey, string> = {
  lead: leadImage,
  artisan: artisanImage,
  lake: lakeImage,
  sport: sportImage,
};

export const STORY_IMAGE_LABELS: Record<StoryImageKey, string> = {
  lead: "Valley lead",
  artisan: "Artisan hands",
  lake: "Dal Lake",
  sport: "Sport",
};

export function storyImage(key: string): string {
  return images[key as StoryImageKey] ?? images.lead;
}
