/**
 * The site's copy, in one place. It publishes in English: there is no language
 * switch and no second deployment.
 */

export const t = {
  brandTagline: "Kashmir. Connected to the World.",
  skipToContent: "Skip to content",
  home: "Home",
  news: "News",
  allNews: "All news",
  videos: "Videos",
  schedule: "Schedule",
  about: "About",
  team: "Team",
  contact: "Contact",
  watchLive: "Watch live",
  search: "Search",
  searchPlaceholder: "Search stories…",
  searchStories: "Search stories",
  closeSearch: "Close search",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  noStoriesFound: "No stories found.",
  breaking: "Breaking",
  liveNow: "Live now",
  liveStandby: "Next up",
  latest: "The latest",
  latestVideos: "Latest videos",
  latestStories: "Latest stories",
  mostRead: "Top stories",
  opinion: "Opinion & People",
  programs: "Programmes",
  viewAll: "View all",
  watch: "Watch",
  read: "Read",
  fullSchedule: "Full schedule",
  subscribe: "Subscribe on YouTube",
  subscribeBody: "Get every bulletin, interview and original as soon as it is published.",
  subscribeCta: "Subscribe",
  followUs: "Follow us",
  openSchedule: "Open the schedule",
  quickLinks: "Quick links",
  categories: "Sections",
  getInTouch: "Get in touch",
  noStories: "No stories published yet",
  noStoriesBody: "Once a story is published from the studio it appears here.",
  story: "story",
  stories: "stories",
  video: "Video",
} as const;

export type UiStrings = typeof t;

/** Section titles, one name each. */
export const categoryTitles = {
  kashmir: "Kashmir",
  pakistan: "Pakistan",
  world: "World",
  library: "Library",
} as const;

export type CategoryTitleKey = keyof typeof categoryTitles;
