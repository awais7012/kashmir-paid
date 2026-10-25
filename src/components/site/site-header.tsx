import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { LiveButton } from "@/components/site/live-button";
import { UtilityBar } from "@/components/site/utility-bar";
import { BRAND_LOGO } from "@/lib/brand";
import { publicStories } from "@/lib/home-feed";
import { t } from "@/lib/i18n";
import { slugifyLabel, type SiteSettings } from "@/lib/site-settings";
import { socialLinks } from "@/lib/social";
import { looksUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import { storiesQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

const NAV_ITEM_CLASS =
  "relative py-2 text-[12px] font-black tracking-[0.1em] uppercase text-navy-foreground/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky";

/** The active section is marked with the brand green, not just a colour change. */
const NAV_ACTIVE_CLASS =
  "text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-green";

const NAV_LINKS = [
  { to: "/schedule", labelKey: "schedule" },
  { to: "/about", labelKey: "about" },
  { to: "/team", labelKey: "team" },
  { to: "/contact", labelKey: "contact" },
] as const;

/** Scroll past this and the masthead sheds the utility bar and shrinks. */
const COMPACT_AT_PX = 12;

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newsOpen, setNewsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // Shares the cache key with the homepage loader, so this usually costs nothing.
  const { data: fetched = [] } = useQuery(storiesQueryOptions);
  // The masthead obeys the same rule as the page: no test copy. Otherwise the
  // ticker would announce a story the page hides.
  const stories = useMemo(() => publicStories(fetched), [fetched]);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > COMPACT_AT_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A drawer that swallows Escape or leaves focus behind is a trap, so both
  // are handled here rather than left to the browser.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    drawerRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen) setSearchOpen(false);
  }, [drawerOpen]);

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

  const navLinks = NAV_LINKS.map((link) => ({ to: link.to, label: t[link.labelKey] }));

  return (
    <header className="sticky top-0 z-50">
      <UtilityBar
        stories={stories.slice(0, 5)}
        social={social}
        className={cn(
          "overflow-hidden transition-all duration-300 motion-reduce:transition-none",
          compact ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
        )}
      />

      <div
        className={cn(
          "bg-navy text-navy-foreground transition-shadow duration-300 motion-reduce:transition-none",
          compact && "shadow-header",
        )}
      >
        <div className="page-shell flex items-center gap-4 py-2.5">
          <Link
            to="/"
            aria-label="Global Kashmir TV, home"
            className="flex min-w-0 shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
          >
            <img
              src={BRAND_LOGO}
              alt=""
              width={1254}
              height={1254}
              className={cn(
                "rounded-full bg-white object-cover transition-all duration-300 motion-reduce:transition-none",
                compact ? "size-9" : "size-10 sm:size-12",
              )}
            />
            <span
              className={cn(
                "hidden font-display leading-none font-black tracking-tight whitespace-nowrap uppercase transition-all duration-300 motion-reduce:transition-none sm:block",
                compact ? "text-lg" : "text-xl lg:text-2xl",
              )}
            >
              Global Kashmir <span className="text-sky">TV</span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden min-w-0 flex-1 items-center justify-center gap-7 lg:flex"
          >
            <Link to="/" className={cn(NAV_ITEM_CLASS, pathname === "/" && NAV_ACTIVE_CLASS)}>
              {t.home}
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
                  newsActive && NAV_ACTIVE_CLASS,
                )}
              >
                {t.news}
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-3.5 transition-transform", newsOpen && "rotate-180")}
                />
              </button>

              {newsOpen ? (
                <div className="absolute top-full start-0 z-50 grid w-60 border border-border bg-card py-1 text-foreground shadow-lift">
                  <Link
                    to="/news"
                    onClick={() => setNewsOpen(false)}
                    className="px-4 py-2.5 text-start text-[11px] font-black tracking-[0.1em] uppercase hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                  >
                    {t.allNews}
                  </Link>
                  {categories.map((name) => (
                    <Link
                      key={name}
                      to="/section/$category"
                      params={{ category: slugifyLabel(name) }}
                      onClick={() => setNewsOpen(false)}
                      className={cn(
                        "px-4 py-2.5 text-start text-[11px] font-bold tracking-[0.08em] uppercase hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                        looksUrdu(name) && URDU_TEXT_CLASS,
                      )}
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <Link
              to="/section/$category"
              params={{ category: "videos" }}
              className={cn(NAV_ITEM_CLASS, pathname === "/section/videos" && NAV_ACTIVE_CLASS)}
            >
              {t.videos}
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(NAV_ITEM_CLASS, pathname === link.to && NAV_ACTIVE_CLASS)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex shrink-0 items-center gap-2 lg:ms-0">
            <button
              type="button"
              aria-label={t.search}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
              className="grid size-10 place-items-center rounded-sm text-navy-foreground transition-colors hover:bg-navy-foreground/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
            >
              <Search className="size-4" />
            </button>

            <LiveButton className="hidden sm:inline-flex" compact={compact} />

            <button
              type="button"
              aria-label={t.openMenu}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="grid size-10 place-items-center rounded-sm bg-navy-foreground/10 text-navy-foreground transition-colors hover:bg-navy-foreground/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-navy-foreground/15 bg-navy-deep">
            <div className="page-shell py-4">
              <label className="sr-only" htmlFor="site-search">
                {t.searchStories}
              </label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <input
                  id="site-search"
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="min-w-0 rounded-sm border border-navy-foreground/25 bg-navy px-4 py-2.5 text-sm text-white placeholder:text-navy-foreground/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label={t.closeSearch}
                  className="grid size-11 place-items-center rounded-sm bg-navy-foreground/10 text-navy-foreground hover:bg-navy-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
                >
                  <X className="size-5" />
                </button>
              </div>
              {query.trim() ? (
                <div className="mt-2 grid overflow-hidden rounded-sm border border-border bg-card text-foreground">
                  {matches.length > 0 ? (
                    matches.map((story) => (
                      <Link
                        key={story.id}
                        to="/story/$slug"
                        params={{ slug: story.slug }}
                        onClick={() => setSearchOpen(false)}
                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-b border-border p-3 last:border-b-0 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                      >
                        <span
                          {...storyTextAttrs(story.language)}
                          className={cn(
                            "text-[10px] font-black text-green uppercase",
                            looksUrdu(story.category) && URDU_TEXT_CLASS,
                          )}
                        >
                          {story.category}
                        </span>
                        <span
                          {...storyTextAttrs(story.language)}
                          className={cn(
                            "min-w-0 truncate text-sm font-bold",
                            looksUrdu(story.title) && URDU_TEXT_CLASS,
                          )}
                        >
                          {story.title}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">{t.noStoriesFound}</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        navLinks={navLinks}
        pathname={pathname}
        drawerRef={drawerRef}
        newsActive={newsActive}
      />
    </header>
  );
}

/**
 * The small-screen menu. It slides in from the edge the page reads towards —
 * the right in English, the left in Urdu — so it feels like it belongs to the
 * page. The WATCH LIVE button stays pinned at the top, where the thumb sits.
 */
function MobileDrawer({
  open,
  onClose,
  categories,
  navLinks,
  pathname,
  drawerRef,
  newsActive,
}: {
  open: boolean;
  onClose: () => void;
  categories: string[];
  navLinks: { to: "/schedule" | "/about" | "/team" | "/contact"; label: string }[];
  pathname: string;
  drawerRef: RefObject<HTMLDivElement | null>;
  newsActive: boolean;
}) {
  const [newsOpen, setNewsOpen] = useState(false);

  useEffect(() => {
    if (!open) setNewsOpen(false);
  }, [open]);

  const itemClass =
    "border-b border-border py-3 text-start text-sm font-bold text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div className={cn("lg:hidden", !open && "pointer-events-none")}>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-foreground/60 transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.openMenu}
        tabIndex={-1}
        /* inert keeps the off-screen links out of the tab order while closed. */
        inert={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col overflow-y-auto border-l border-border bg-card shadow-lift transition-transform duration-300 motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-foreground p-4">
          <span className="font-display text-xl font-black uppercase">
            Global Kashmir <span className="text-primary">TV</span>
          </span>
          <button
            type="button"
            aria-label={t.closeMenu}
            onClick={onClose}
            className="grid size-9 place-items-center rounded-sm border border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-border p-4">
          <LiveButton className="w-full justify-center" />
        </div>

        <nav aria-label="Mobile navigation" className="grid px-4 pb-8">
          <Link
            to="/"
            onClick={onClose}
            className={cn(itemClass, pathname === "/" && "text-primary")}
          >
            {t.home}
          </Link>

          <button
            type="button"
            aria-expanded={newsOpen}
            onClick={() => setNewsOpen((value) => !value)}
            className={cn(
              itemClass,
              "inline-flex items-center justify-between gap-2",
              newsActive && "text-primary",
            )}
          >
            {t.news}
            <ChevronDown
              aria-hidden="true"
              className={cn("size-4 transition-transform", newsOpen && "rotate-180")}
            />
          </button>

          {newsOpen ? (
            <div className="grid border-b border-border pb-2">
              <Link
                to="/news"
                onClick={onClose}
                className="px-3 py-2.5 text-start text-xs font-black tracking-[0.1em] uppercase hover:text-primary"
              >
                {t.allNews}
              </Link>
              {categories.map((name) => (
                <Link
                  key={name}
                  to="/section/$category"
                  params={{ category: slugifyLabel(name) }}
                  onClick={onClose}
                  className={cn(
                    "px-3 py-2.5 text-start text-xs font-bold tracking-[0.06em] uppercase hover:text-primary",
                    looksUrdu(name) && URDU_TEXT_CLASS,
                  )}
                >
                  {name}
                </Link>
              ))}
            </div>
          ) : null}

          <Link
            to="/section/$category"
            params={{ category: "videos" }}
            onClick={onClose}
            className={cn(itemClass, pathname === "/section/videos" && "text-primary")}
          >
            {t.videos}
          </Link>

          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={cn(itemClass, pathname === link.to && "text-primary")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
