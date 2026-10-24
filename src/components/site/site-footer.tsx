import { Link } from "@tanstack/react-router";
import { BRAND_LOGO } from "@/lib/brand";
import { socialLinks } from "@/lib/social";
import type { SiteSettings } from "@/lib/site-settings";

const FOOTER_LINKS = [
  { to: "/", label: "Home" },
  { to: "/news", label: "News" },
  { to: "/schedule", label: "Schedule" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const social = socialLinks(settings);

  return (
    <footer className="bg-foreground px-4 py-10 text-background">
      <div className="mx-auto grid max-w-[1440px] gap-8">
        <div className="grid gap-6 border-b border-background/20 pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="flex items-center gap-3">
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
                className="size-12 rounded-full bg-white object-cover"
              />
            </Link>
            <Link
              to="/"
              className="font-display text-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Global Kashmir <span className="text-primary">TV</span>
            </Link>
          </div>

          {social.length > 0 ? (
            <div className="flex flex-wrap gap-2">
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
                    className="grid size-10 place-items-center border border-background/40 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-[11px] font-bold tracking-[0.1em] uppercase transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-[10px] tracking-[0.16em] text-background/60 uppercase">
          {settings.footer.note} · {settings.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
