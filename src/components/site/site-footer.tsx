import { Link } from "@tanstack/react-router";
import type { SiteSettings } from "@/lib/site-settings";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-foreground px-4 py-8 text-background">
      <div className="mx-auto grid max-w-[1440px] gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <Link
          to="/"
          className="font-display text-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Global Kashmir <span className="text-primary">TV</span>
        </Link>
        <p className="text-[10px] tracking-[0.16em] text-background/60 uppercase">
          {settings.footer.note} · {settings.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
