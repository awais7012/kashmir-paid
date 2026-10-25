import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Globe,
  Landmark,
  Library,
  Mountain,
  Newspaper,
  Palette,
  Trophy,
} from "lucide-react";

/**
 * Colour and icon for a category. Categories are free text on a story, so this
 * maps the names the desk uses (in either script) onto the token set, and falls
 * back to a neutral chip and the newspaper mark for anything new.
 *
 * The chip colour is a token (`bg-cat-*`), never a literal.
 */
export type CategoryStyle = {
  /** A `bg-cat-*` utility, coloured dark enough for white chip text. */
  chipClass: string;
  icon: LucideIcon;
};

type Entry = { aliases: string[]; chipClass: string; icon: LucideIcon };

const ENTRIES: Entry[] = [
  { aliases: ["kashmir", "کشمیر", "jammu", "ladakh"], chipClass: "bg-cat-kashmir", icon: Mountain },
  {
    aliases: ["world", "global", "international", "دنیا"],
    chipClass: "bg-cat-world",
    icon: Globe,
  },
  {
    aliases: ["politics", "political", "pakistan", "پاکستان", "سیاست"],
    chipClass: "bg-cat-politics",
    icon: Landmark,
  },
  {
    aliases: ["business", "economy", "market", "بزنس", "معیشت"],
    chipClass: "bg-cat-business",
    icon: Briefcase,
  },
  { aliases: ["sports", "sport", "کھیل"], chipClass: "bg-cat-sports", icon: Trophy },
  {
    aliases: ["culture", "heritage", "art", "library", "opinion", "ورثہ", "ثقافت", "کتب خانہ"],
    chipClass: "bg-cat-culture",
    icon: Palette,
  },
  {
    aliases: ["shows", "videos", "programmes", "شوز"],
    chipClass: "bg-cat-business",
    icon: Library,
  },
];

const FALLBACK: CategoryStyle = { chipClass: "bg-cat-default", icon: Newspaper };

export function categoryStyle(name: string): CategoryStyle {
  const value = name.trim().toLowerCase();
  if (!value) return FALLBACK;

  for (const entry of ENTRIES) {
    if (entry.aliases.some((alias) => value === alias || value.includes(alias))) {
      return { chipClass: entry.chipClass, icon: entry.icon };
    }
  }
  return FALLBACK;
}
