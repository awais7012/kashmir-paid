import { categoryStyle } from "@/lib/category-style";
import { localiseCategory, looksUrdu, URDU_TEXT_CLASS } from "@/lib/story-language";
import { useSiteLanguage } from "@/lib/site-language-context";
import { cn } from "@/lib/utils";

/**
 * The small category label that sits on a card. Its colour comes from the
 * category itself (see category-style.ts), so a reader scanning the page learns
 * the section at a glance. Red is never used here — it belongs to LIVE and
 * BREAKING alone.
 */
export function CategoryChip({ label, className }: { label: string; className?: string }) {
  const { language } = useSiteLanguage();
  const displayLabel = localiseCategory(label, language);
  const { chipClass } = categoryStyle(label);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 text-[10px] font-black tracking-[0.08em] text-navy-foreground uppercase",
        chipClass,
        looksUrdu(displayLabel) && URDU_TEXT_CLASS,
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
