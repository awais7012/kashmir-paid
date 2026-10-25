import { Link } from "@tanstack/react-router";
import { SectionHeader, ViewAllLink } from "@/components/site/section-header";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { SiteSettings } from "@/lib/site-settings";

/**
 * The schedule module: the picture the desk uploaded, shown as-is with a route
 * to the full schedule page. It invents no timeline — with no picture the module
 * is not drawn.
 */
export function ScheduleCard({ settings }: { settings: SiteSettings }) {
  const image = mediaUrl(settings.schedule.image);
  if (!image) return null;

  const title = settings.schedule.title || t.schedule;

  return (
    <section aria-label={title}>
      <SectionHeader title={title} action={<ViewAllLink to="/schedule" label={t.openSchedule} />} />
      <Link
        to="/schedule"
        className="mt-4 block overflow-hidden rounded-card border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="max-h-[360px] w-full object-cover object-top"
        />
      </Link>
    </section>
  );
}
