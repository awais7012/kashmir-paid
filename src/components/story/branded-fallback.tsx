import { BRAND_LOGO } from "@/lib/brand";
import { categoryStyle } from "@/lib/category-style";
import { looksUrdu, URDU_TEXT_CLASS } from "@/lib/story-language";
import { cn } from "@/lib/utils";

/**
 * The plate behind a story that has no picture: the branded gradient with the
 * logo and the section. It is a token gradient (`surface-plate`), so it never
 * invents a colour, and it is never mistaken for a photograph.
 */
export function BrandedFallback({ category, className }: { category: string; className?: string }) {
  const { icon: Icon } = categoryStyle(category);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "surface-plate absolute inset-0 flex flex-col items-center justify-center gap-2.5",
        className,
      )}
    >
      <img src={BRAND_LOGO} alt="" className="size-11 rounded-full bg-white object-cover" />
      {category ? (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 text-[10px] font-black tracking-[0.18em] text-navy-foreground uppercase",
            looksUrdu(category) && URDU_TEXT_CLASS,
          )}
        >
          <Icon className="size-3.5" />
          {category}
        </span>
      ) : null}
    </span>
  );
}
