import { forSiteLang } from "@/lib/site-lang";
import { slugifyLabel } from "@/lib/site-settings";
import type { Story } from "@/lib/stories";

/**
 * The homepage shows each story once. This module decides which story goes
 * where, before any component renders, so de-duplication is a single readable
 * rule rather than something each section has to remember.
 */

/**
 * Test scaffolding is named as such from the start: "Test story", "Testing the
 * ticker", "testinh-headlines". Anchoring the match to the first word is what
 * keeps real headlines such as "winter restrictions … plans are tested" from
 * being hidden along with it.
 */
function startsWithTestWord(value: string): boolean {
  const first =
    value
      .toLowerCase()
      .trim()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)[0] ?? "";
  return first.startsWith("test");
}

export function isTestStory(story: Pick<Story, "title" | "slug">): boolean {
  return startsWithTestWord(story.title) || startsWithTestWord(story.slug);
}

/**
 * Everything public: no test scaffolding, and only this deployment's language.
 * Every public list on the site reads through here, so a bilingual archive
 * still renders as a single-language publication.
 */
export function publicStories(stories: Story[]): Story[] {
  return forSiteLang(stories.filter((story) => !isTestStory(story)));
}

/**
 * Sections look for a category by name, and an editor may have typed it in
 * either script, so each known section carries its aliases. An unknown category
 * becomes its own group.
 */
export const CATEGORY_SECTIONS = [
  { key: "kashmir", label: "Kashmir", aliases: ["Kashmir", "کشمیر"] },
  { key: "pakistan", label: "Pakistan", aliases: ["Pakistan", "پاکستان"] },
  { key: "world", label: "World", aliases: ["World", "Global", "international", "دنیا"] },
  { key: "politics", label: "Politics", aliases: ["Politics", "سیاست"] },
  { key: "business", label: "Business", aliases: ["Business", "Economy", "بزنس", "معیشت"] },
  { key: "sports", label: "Sports", aliases: ["Sports", "Sport", "کھیل"] },
  { key: "culture", label: "Culture", aliases: ["Culture", "Heritage", "Art", "ورثہ", "ثقافت"] },
  { key: "library", label: "Library", aliases: ["Library", "کتب خانہ"] },
] as const;

/** Opinion has its own two-column treatment. */
export const OPINION_ALIASES = ["Opinion", "People", "رائے", "عوام"] as const;

/** International reads as the World section. */
export const INTERNATIONAL_ALIASES = ["World", "Global", "International", "دنیا"] as const;

export type CategorySection = {
  key: string;
  label: string;
  stories: Story[];
};

export type HomeFeed = {
  /** The Editor's Pick: the one featured story. */
  pick: Story | null;
  /** Hero slides, most prominent first. */
  hero: Story[];
  /** The "Latest news" rows beside the hero. */
  latestNews: Story[];
  /** Video stories for the video row; the row needs four to be worth drawing. */
  videos: Story[];
  /** Categories ranked by how much they hold, each with up to four stories. */
  categories: CategorySection[];
  topStories: Story[];
  international: Story[];
  opinion: Story[];
};

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function matchesCategory(category: string, aliases: readonly string[]): boolean {
  const value = normalise(category);
  return aliases.some((alias) => value === normalise(alias));
}

function matchesAliases(story: Story, aliases: readonly string[]): boolean {
  return matchesCategory(story.category, aliases);
}

function byRecency(a: Story, b: Story): number {
  return b.published_at.localeCompare(a.published_at);
}

function groupFor(category: string): { key: string; label: string; aliases: string[] } {
  const known = CATEGORY_SECTIONS.find((section) => matchesCategory(category, section.aliases));
  if (known) return { key: known.key, label: known.label, aliases: [...known.aliases] };
  const label = category.trim();
  return { key: slugifyLabel(label) || normalise(label), label, aliases: [label] };
}

export function selectHomeFeed(stories: Story[]): HomeFeed {
  const pool = publicStories(stories);
  const used = new Set<string>();

  const takeFrom = (
    list: Story[],
    count: number,
    match: (story: Story) => boolean = () => true,
  ): Story[] => {
    const picked: Story[] = [];
    for (const story of list) {
      if (picked.length >= count) break;
      if (used.has(story.id) || !match(story)) continue;
      used.add(story.id);
      picked.push(story);
    }
    return picked;
  };
  const take = (count: number, match?: (story: Story) => boolean) => takeFrom(pool, count, match);

  // The Editor's Pick is the featured story; if the pick were left in the pool
  // it would also top the hero, and the same story would appear twice.
  const pick = pool.find((story) => story.featured) ?? null;
  if (pick) used.add(pick.id);

  // The video row needs four stories to be worth drawing, so a video must never
  // be spent on the hero and leave the row empty.
  const videos = take(4, (story) => story.has_video);

  // The hero slider: the five most prominent remaining stories.
  const hero = take(5);

  // The "Latest news" rows are the most recent remaining stories.
  const latestNews = takeFrom([...pool].sort(byRecency), 5);

  const topStories = take(4);

  // Rank categories by how much they hold, then claim up to four stories each so
  // the blocks stay balanced and no story is reused.
  const counts = new Map<string, { group: ReturnType<typeof groupFor>; count: number }>();
  for (const story of pool) {
    if (used.has(story.id) || !story.category.trim()) continue;
    const group = groupFor(story.category);
    const entry = counts.get(group.key);
    if (entry) entry.count += 1;
    else counts.set(group.key, { group, count: 1 });
  }

  const categories: CategorySection[] = [...counts.values()]
    .sort((a, b) => b.count - a.count || a.group.label.localeCompare(b.group.label))
    .map(({ group }) => ({
      key: group.key,
      label: group.label,
      stories: take(4, (story) => matchesAliases(story, group.aliases)),
    }))
    .filter((section) => section.stories.length > 0);

  const international = take(3, (story) => matchesAliases(story, INTERNATIONAL_ALIASES));
  const opinion = take(3, (story) => matchesAliases(story, OPINION_ALIASES));

  return { pick, hero, latestNews, videos, categories, topStories, international, opinion };
}
