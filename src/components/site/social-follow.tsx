import { Motif } from "@/components/site/motif";
import type { SocialLink } from "@/lib/social";
import { cn } from "@/lib/utils";

/** The follow block in the sidebar. Hidden when no network is configured. */
export function SocialFollow({
  social,
  title,
  className,
}: {
  social: SocialLink[];
  title: string;
  className?: string;
}) {
  if (social.length === 0) return null;

  return (
    <section
      aria-label={title}
      className={cn(
        "surface-navy relative overflow-hidden p-5 text-navy-foreground shadow-card",
        className,
      )}
    >
      <Motif className="opacity-[0.06]" />
      <h2 className="relative z-10 text-[10px] font-black tracking-[0.16em] text-sky uppercase">
        {title}
      </h2>
      <ul className="relative z-10 mt-4 grid gap-2">
        {social.map((item) => {
          const Icon = item.Icon;
          return (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 border border-navy-foreground/20 px-3 py-2.5 text-xs font-bold transition-colors hover:border-sky hover:bg-navy-foreground/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
