import { Mail, Phone } from "lucide-react";
import { t } from "@/lib/i18n";
import type { SocialLink } from "@/lib/social";
import { cn } from "@/lib/utils";

/**
 * The slim navy bar above the masthead: the tagline on the left, and the desk's
 * phone, email and social links on the right — each rendered only when the desk
 * has filled it in. There is no language switch; the site publishes in one
 * language per deployment.
 */
export function UtilityBar({
  tagline,
  phone,
  email,
  social,
  className,
}: {
  tagline: string;
  phone: string;
  email: string;
  social: SocialLink[];
  className?: string;
}) {
  const hasContact = phone.trim() !== "" || email.trim() !== "";

  return (
    <div className={cn("bg-navy-deep text-navy-foreground", className)}>
      <div className="page-shell flex items-center justify-between gap-4 py-1.5">
        <p className="min-w-0 truncate text-[11px] font-semibold tracking-[0.04em] text-navy-foreground/85">
          {tagline}
        </p>

        <div className="flex shrink-0 items-center gap-3">
          {phone.trim() ? (
            <a
              href={`tel:${phone}`}
              className="hidden items-center gap-1.5 text-[11px] font-semibold text-navy-foreground/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky sm:inline-flex"
            >
              <Phone className="size-3" aria-hidden="true" />
              {phone}
            </a>
          ) : null}
          {email.trim() ? (
            <a
              href={`mailto:${email}`}
              className="hidden items-center gap-1.5 text-[11px] font-semibold text-navy-foreground/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky md:inline-flex"
            >
              <Mail className="size-3" aria-hidden="true" />
              {email}
            </a>
          ) : null}

          {social.length > 0 ? (
            <ul className="flex items-center gap-0.5">
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
          ) : !hasContact ? (
            <span className="sr-only">{t.followUs}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
