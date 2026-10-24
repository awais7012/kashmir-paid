import { useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, Play, Search, X } from "lucide-react";
import { BRAND_LOGO } from "@/lib/brand";
import { slugifyLabel, type SiteSettings } from "@/lib/site-settings";
import { socialLinks } from "@/lib/social";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import { storiesQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

const NAV_ITEM_CLASS =
  "text-[12px] font-bold tracking-[0.12em] uppercase transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// Long or multi-word names wrap inside their cell rather than pushing the grid
// out of shape.
const MOBILE_NAV_ITEM_CLASS =
  "border-b border-border py-3 text-sm font-bold uppercase break-words text-start transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * The top-level menu is fixed. Every section an editor creates is reached
 * through the single News dropdown, so the bar never grows a link per category.
 */
const NAV_LINKS = [
  { to: "/schedule", label: "Schedule" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newsOpen, setNewsOpen] = useState(false);
  const [mobileNewsOpen, setMobileNewsOpen] = useState(false);
  const { pathname } = useLocation();

  // Shares the cache key with the homepage loader, so this usually costs nothing.
  const { data: stories = [] } = useQuery(storiesQueryOptions);

  // The menu lists the sections that actually hold stories, so it has no dead links.
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const story of stories) {
      const name = story.category.trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push(name);
      }
    }
    return list.sort((a, b) => a.localeCompare(b));
  }, [stories]);

  const social = socialLinks(settings);

  const newsActive = pathname === "/news" || pathname.startsWith("/section/");

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return stories
      .filter((story) =>
        `${story.title} ${story.summary} ${story.category}`.toLowerCase().includes(term),
      )
      .slice(0, 5);
  }, [query, stories]);

  return (
    <header className="relative z-40 bg-card">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b-4 border-foreground py-4 sm:py-5">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link
              to="/"
              aria-label="Global Kashmir TV, home"
              className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <img
                src={BRAND_LOGO}
                alt=""
                width={1254}
                height={1254}
                className="size-11 rounded-full bg-white object-cover sm:size-14 lg:size-16"
              />
            </Link>

            <div className="min-w-0">
              <Link
                to="/"
                className="flex items-baseline gap-2 font-display text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[0.9] font-black uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <span className="truncate">Global Kashmir</span>
                <span className="shrink-0 text-primary">TV</span>
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {social.length > 0 ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                {social.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="grid size-9 place-items-center border border-foreground text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
              className="grid size-10 place-items-center border border-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Search className="size-4" />
            </button>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-10 place-items-center bg-foreground text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Link
              to="/live"
              className="hidden items-center gap-2 bg-primary px-4 py-3 text-xs font-black tracking-[0.12em] text-primary-foreground uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex"
            >
              <span className="signal-pulse size-2 rounded-full bg-primary-foreground" />
              Watch live
            </Link>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-b-2 border-foreground py-4">
            <label className="sr-only" htmlFor="site-search">
              Search stories
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <input
                id="site-search"
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Kashmir, world, culture…"
                className="min-w-0 border border-foreground bg-background px-4 py-3 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:text-sm"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="grid size-12 place-items-center bg-foreground text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X className="size-5" />
              </button>
            </div>
            {query.trim() ? (
              <div className="grid border-x border-b border-border bg-card">
                {matches.length > 0 ? (
                  matches.map((story) => (
                    <Link
                      key={story.id}
                      to="/story/$slug"
                      params={{ slug: story.slug }}
                      onClick={() => setSearchOpen(false)}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-t border-border p-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                    >
                      <span
                        {...storyTextAttrs(story.language)}
                        className={cn(
                          "text-[10px] font-black text-primary uppercase",
                          isUrdu(story.language) && URDU_TEXT_CLASS,
                        )}
                      >
                        {story.category}
                      </span>
                      <span
                        {...storyTextAttrs(story.language)}
                        className={cn(
                          "min-w-0 truncate font-display text-lg font-bold",
                          isUrdu(story.language) && URDU_TEXT_CLASS,
                        )}
                      >
                        {story.title}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">No stories found.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <nav
          className="hidden items-center justify-center gap-x-10 border-b border-border py-4 lg:flex"
          aria-label="Main navigation"
        >
          <Link to="/" className={cn(NAV_ITEM_CLASS, pathname === "/" && "text-primary")}>
            Home
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setNewsOpen(true)}
            onMouseLeave={() => setNewsOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setNewsOpen(false);
            }}
          >
            <button
              type="button"
              aria-expanded={newsOpen}
              aria-haspopup="true"
              onClick={() => setNewsOpen((open) => !open)}
              className={cn(
                NAV_ITEM_CLASS,
                "inline-flex items-center gap-1.5",
                newsActive && "text-primary",
              )}
            >
              News
              <ChevronDown
                aria-hidden="true"
                className={cn("size-3.5 transition-transform", newsOpen && "rotate-180")}
              />
            </button>

            {newsOpen ? (
              <div className="absolute top-full left-0 z-50 grid w-60 border-2 border-foreground bg-card py-1 shadow-lg">
                <Link
                  to="/news"
                  onClick={() => setNewsOpen(false)}
                  className="px-4 py-2.5 text-[11px] font-black tracking-[0.1em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                >
                  All news
                </Link>
                {categories.map((name) => (
                  <Link
                    key={name}
                    to="/section/$category"
                    params={{ category: slugifyLabel(name) }}
                    onClick={() => setNewsOpen(false)}
                    className="px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(NAV_ITEM_CLASS, pathname === link.to && "text-primary")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {menuOpen ? (
          <nav
            className="grid grid-cols-2 border-b border-foreground py-4 lg:hidden"
            aria-label="Mobile navigation"
          >
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={cn(MOBILE_NAV_ITEM_CLASS, pathname === "/" && "text-primary")}
            >
              Home
            </Link>
            <button
              type="button"
              aria-expanded={mobileNewsOpen}
              onClick={() => setMobileNewsOpen((open) => !open)}
              className={cn(
                MOBILE_NAV_ITEM_CLASS,
                "inline-flex items-center justify-between gap-2",
                newsActive && "text-primary",
              )}
            >
              News
              <ChevronDown
                aria-hidden="true"
                className={cn("size-4 transition-transform", mobileNewsOpen && "rotate-180")}
              />
            </button>

            {mobileNewsOpen ? (
              <div className="col-span-2 grid border-b border-border bg-muted/40 pb-2">
                <Link
                  to="/news"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 text-[11px] font-black tracking-[0.1em] uppercase hover:text-primary"
                >
                  All news
                </Link>
                {categories.map((name) => (
                  <Link
                    key={name}
                    to="/section/$category"
                    params={{ category: slugifyLabel(name) }}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase hover:text-primary"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            ) : null}

            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={cn(MOBILE_NAV_ITEM_CLASS, pathname === link.to && "text-primary")}
              >
                {link.label}
              </Link>
            ))}

            {social.length > 0 ? (
              <div className="col-span-2 flex items-center gap-2 pt-4">
                {social.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      className="grid size-10 place-items-center border border-foreground hover:bg-foreground hover:text-background"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
