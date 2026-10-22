import { Link } from "@tanstack/react-router";
import { BRAND_LOGO } from "@/lib/brand";
import type { SiteSettings } from "@/lib/site-settings";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-foreground px-4 py-8 text-background">
      <div className="mx-auto grid max-w-[1440px] gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
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
        <p className="text-[10px] tracking-[0.16em] text-background/60 uppercase">
          {settings.footer.note} · {settings.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
