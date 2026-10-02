import { useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Play, Search, X } from "lucide-react";
import { storiesQueryOptions } from "@/lib/stories";
import { isUrdu, looksUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import {
  navHref,
  slugifyLabel,
  visibleSections,
  type NavSection,
  type SiteSettings,
} from "@/lib/site-settings";
import { cn } from "@/lib/utils";

const NAV_ITEM_CLASS =
  "text-[11px] font-bold tracking-[0.1em] uppercase transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function NavLink({
  section,
  className,
  onNavigate,
}: {
  section: NavSection;
  className?: string;
  onNavigate?: () => void;
}) {
  // Nav labels are typed by an editor, so an Urdu label gets Urdu treatment.
  const urdu = looksUrdu(section.label);
  const shared = {
    ...storyTextAttrs(urdu ? "ur" : "en"),
    className: cn(className, urdu && URDU_TEXT_CLASS),
    onClick: onNavigate,
  };

  if (section.kind === "home") {
    return (
      <Link to="/" {...shared}>
        {section.label}
      </Link>
    );
  }
  if (section.kind === "live") {
    return (
      <Link to="/live" {...shared}>
        {section.label}
      </Link>
    );
  }
  if (section.kind === "index") {
    return (
      <Link to="/news" {...shared}>
        {section.label}
      </Link>
    );
  }
  return (
    <Link to="/section/$category" params={{ category: slugifyLabel(section.label) }} {...shared}>
      {section.label}
    </Link>
  );
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { pathname } = useLocation();

  // Shares the cache key with the homepage loader, so this usually costs nothing.
  const { data: stories = [] } = useQuery(storiesQueryOptions);
  const sections = visibleSections(settings);

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
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b-4 border-foreground py-5 sm:py-7">
          <div className="min-w-0">
            <Link
              to="/"
              className="flex items-baseline gap-2 font-display text-[clamp(2rem,6vw,5.25rem)] leading-[.82] font-black uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <span className="truncate">Global Kashmir</span>
              <span className="shrink-0 text-primary">TV</span>
            </Link>
            <p className="mt-3 text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase sm:text-[11px] sm:tracking-[0.34em]">
              Kashmir. Connected to the World.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
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
          className="hidden items-center justify-between border-b border-border py-3 lg:flex"
          aria-label="Main navigation"
        >
          {sections.map((section) => (
            <NavLink
              key={`${section.kind}-${section.label}`}
              section={section}
              className={cn(NAV_ITEM_CLASS, pathname === navHref(section) && "text-primary")}
            />
          ))}
        </nav>

        {menuOpen ? (
          <nav
            className="grid grid-cols-2 border-b border-foreground py-4 lg:hidden"
            aria-label="Mobile navigation"
          >
            {sections.map((section) => (
              <NavLink
                key={`${section.kind}-${section.label}`}
                section={section}
                className={cn(
                  "border-b border-border py-3 text-sm font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  pathname === navHref(section) && "text-primary",
                )}
                onNavigate={() => setMenuOpen(false)}
              />
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
