import { BreakingTicker } from "@/components/site/breaking-ticker";
import { formatToday } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { SocialLink } from "@/lib/social";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * The slim navy bar above the masthead: today's date, the breaking strip and
 * the social links. There is no language switch — the site publishes in English
 * while individual articles may be written in Urdu or English.
 */
export function UtilityBar({
  stories,
  social,
  className,
}: {
  stories: Story[];
  social: SocialLink[];
  className?: string;
}) {
  const today = formatToday();

  return (
    <div className={cn("bg-navy-deep text-navy-foreground", className)}>
      <div className="page-shell flex items-center gap-4 py-1.5">
        <p className="hidden shrink-0 text-[11px] font-semibold tracking-[0.06em] text-navy-foreground/90 lg:block">
          <time dateTime={new Date().toISOString()}>{today}</time>
        </p>
        <span
          className="hidden h-4 w-px shrink-0 bg-navy-foreground/20 lg:block"
          aria-hidden="true"
        />

        <BreakingTicker stories={stories} />

        {social.length > 0 ? (
          <ul className="hidden shrink-0 items-center gap-1 sm:flex">
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
                    className="grid size-7 place-items-center rounded-sm text-navy-foreground/80 transition-colors hover:bg-navy-foreground/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="sr-only">{t.followUs}</span>
        )}
      </div>
    </div>
  );
}
