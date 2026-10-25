import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";
import { BRAND_LOGO } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { publicStories } from "@/lib/home-feed";
import { slugifyLabel, type SiteSettings } from "@/lib/site-settings";
import { socialLinks } from "@/lib/social";
import { looksUrdu, URDU_TEXT_CLASS } from "@/lib/story-language";
import { storiesQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { to: "/", labelKey: "home" },
  { to: "/news", labelKey: "news" },
  { to: "/live", labelKey: "watchLive" },
  { to: "/schedule", labelKey: "schedule" },
  { to: "/about", labelKey: "about" },
  { to: "/team", labelKey: "team" },
  { to: "/contact", labelKey: "contact" },
] as const;

/** The shared footer: solid navy, with the brand, sections, contact and social. */
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { data: stories = [] } = useQuery(storiesQueryOptions);
  const social = socialLinks(settings);

  // Sections are free text on a story, so the counts come from the feed rather
  // than a fixed list, and a section with nothing in it is never shown.
  const sections = (() => {
    const counts = new Map<string, number>();
    for (const story of publicStories(stories)) {
      const name = story.category.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();

  const contact = [
    { Icon: MapPin, value: settings.contact.address, href: "" },
    { Icon: Phone, value: settings.contact.phone, href: `tel:${settings.contact.phone}` },
    { Icon: Mail, value: settings.contact.email, href: `mailto:${settings.contact.email}` },
  ].filter((item) => item.value.trim() !== "");

  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="page-shell section-pad">
        <div className="grid gap-10 border-b border-navy-foreground/15 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link
              to="/"
              aria-label="Global Kashmir TV, home"
              className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
            >
              <img
                src={BRAND_LOGO}
                alt=""
                width={160}
                height={160}
                className="size-12 rounded-full bg-white object-cover"
              />
              <span className="font-display text-2xl leading-[0.95] font-black uppercase sm:text-3xl">
                Global Kashmir <span className="text-sky">TV</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-foreground/75">
              {t.brandTagline}
            </p>

            {social.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {social.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        title={item.label}
                        className="grid size-9 place-items-center rounded-sm border border-navy-foreground/25 transition-colors hover:border-sky hover:bg-navy-foreground/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <nav aria-label={t.quickLinks}>
            <h2 className="text-[10px] font-black tracking-[0.16em] text-sky uppercase">
              {t.quickLinks}
            </h2>
            <ul className="mt-4 grid gap-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-navy-foreground/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
                  >
                    {t[link.labelKey]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {sections.length > 0 ? (
            <nav aria-label={t.categories}>
              <h2 className="text-[10px] font-black tracking-[0.16em] text-sky uppercase">
                {t.categories}
              </h2>
              <ul className="mt-4 grid gap-2.5">
                {sections.map(([name, count]) => (
                  <li key={name}>
                    <Link
                      to="/section/$category"
                      params={{ category: slugifyLabel(name) }}
                      className="flex items-center justify-between gap-3 text-sm text-navy-foreground/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
                    >
                      <span className={cn("truncate", looksUrdu(name) && URDU_TEXT_CLASS)}>
                        {name}
                      </span>
                      <span className="shrink-0 text-xs text-navy-foreground/55">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {contact.length > 0 ? (
            <div>
              <h2 className="text-[10px] font-black tracking-[0.16em] text-sky uppercase">
                {t.getInTouch}
              </h2>
              <ul className="mt-4 grid gap-3">
                {contact.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <li
                      key={item.value}
                      className="flex items-start gap-2.5 text-sm text-navy-foreground/80"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-sky" aria-hidden="true" />
                      {item.href ? (
                        <a
                          href={item.href}
                          className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span>{item.value}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="text-xs text-navy-foreground/60">
            {settings.footer.note}
            {settings.footer.note && settings.footer.copyright ? " · " : ""}
            {settings.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
