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

/** Everything public: no test scaffolding. Every list reads through here. */
export function publicStories(stories: Story[]): Story[] {
  return stories.filter((story) => !isTestStory(story));
}

/**
 * Sections look for a category by name, and an editor may have typed it in
 * either script, so each section carries its aliases.
 */
export const CATEGORY_SECTIONS = [
  { key: "kashmir", aliases: ["Kashmir", "کشمیر"] },
  { key: "pakistan", aliases: ["Pakistan", "پاکستان"] },
  { key: "world", aliases: ["World", "Global", "دنیا"] },
  { key: "library", aliases: ["Library", "کتب خانہ"] },
] as const;

/** Opinion has its own dark band rather than a light category block. */
export const OPINION_ALIASES = ["Opinion", "People", "رائے", "عوام"] as const;

/**
 * Programmes are ordinary stories filed under a shows/programmes section — there
 * is no separate model. When none exist the poster row is simply not drawn.
 */
export const PROGRAMME_ALIASES = ["Shows", "Show", "Programmes", "Programs", "شوز"] as const;

export type CategorySection = {
  key: string;
  stories: Story[];
};

export type HomeFeed = {
  lead: Story | null;
  /** Four stories beside the lead. */
  heroSidebar: Story[];
  /** Video stories for the scroll row; the row itself needs four to be worth it. */
  videos: Story[];
  categories: CategorySection[];
  /** Shows/programmes for the tall poster row; empty hides the row. */
  programs: Story[];
  opinion: Story[];
  latest: Story[];
  mostRead: Story[];
};

function matchesCategory(story: Story, aliases: readonly string[]): boolean {
  return aliases.some((alias) => story.category.trim().toLowerCase() === alias.toLowerCase());
}

/**
 * Ranked by how the desk marked a story: featured first, then the editor's
 * explicit order, then recency. There is no view counting in the API yet, so
 * this is a prominence ranking rather than a true "most read".
 */
function byProminence(a: Story, b: Story): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.display_order !== b.display_order) return a.display_order - b.display_order;
  return b.published_at.localeCompare(a.published_at);
}

export function selectHomeFeed(stories: Story[]): HomeFeed {
  const pool = publicStories(stories);
  const used = new Set<string>();

  const take = (count: number, match: (story: Story) => boolean = () => true): Story[] => {
    const picked: Story[] = [];
    for (const story of pool) {
      if (picked.length >= count) break;
      if (used.has(story.id) || !match(story)) continue;
      used.add(story.id);
      picked.push(story);
    }
    return picked;
  };

  const lead =
    pool.find((story) => story.featured) ??
    [...pool].sort((a, b) => b.published_at.localeCompare(a.published_at))[0] ??
    null;
  if (lead) used.add(lead.id);

  // The video shelf is claimed first: it needs four stories to be worth drawing
  // at all, so a video must never be spent on the hero and leave the shelf empty.
  const videos = take(10, (story) => story.has_video);

  // Programmes are claimed next, so a show is never swallowed by the hero either.
  const programs = take(6, (story) => matchesCategory(story, PROGRAMME_ALIASES));

  // The hero shows five frames: the lead plus these four. Taking exactly four
  // leaves nothing stranded — a sixth would be spent on the hero and, because
  // the rotator only draws five, never appear anywhere on the page.
  const heroSidebar = take(4);

  const categories: CategorySection[] = CATEGORY_SECTIONS.map((section) => ({
    key: section.key,
    stories: take(5, (story) => matchesCategory(story, section.aliases)),
  })).filter((section) => section.stories.length > 0);

  const opinion = take(3, (story) => matchesCategory(story, OPINION_ALIASES));
  const latest = take(9);
  const mostRead = take(5);

  return { lead, heroSidebar, videos, categories, programs, opinion, latest, mostRead };
}
