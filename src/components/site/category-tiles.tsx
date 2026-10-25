import { Link } from "@tanstack/react-router";
import { categoryStyle } from "@/lib/category-style";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { slugifyLabel } from "@/lib/site-settings";
import { looksUrdu, URDU_TEXT_CLASS } from "@/lib/story-language";
import type { CategorySection } from "@/lib/home-feed";
import { cn } from "@/lib/utils";

/**
 * The category tiles: one image tile per top section, each with its icon and
 * name, linking to the section. A row of tiles only reads as a row when there
 * are enough of them, so fewer than four hides the whole module.
 */
export function CategoryTiles({
  categories,
  layout = "wide",
}: {
  categories: CategorySection[];
  /** "split" when the live card shares the row, so the tiles read 3-across. */
  layout?: "wide" | "split";
}) {
  const tiles = categories.slice(0, 6);
  if (tiles.length < 4) return null;

  return (
    <section aria-label={t.categories}>
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3",
          layout === "wide" ? "lg:grid-cols-6" : "lg:grid-cols-3",
        )}
      >
        {tiles.map((section) => {
          const { icon: Icon } = categoryStyle(section.label);
          const cover = mediaUrl(section.stories[0]?.hero_image_url ?? null);
          return (
            <Link
              key={section.key}
              to="/section/$category"
              params={{ category: slugifyLabel(section.label) }}
              className="group relative flex h-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-card bg-navy p-3 text-center shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {cover ? (
                <img
                  src={cover}
                  alt=""
                  loading="lazy"
                  className="story-image absolute inset-0 h-full w-full object-cover opacity-45 group-hover:scale-[1.04]"
                />
              ) : null}
              <span className="absolute inset-0 bg-navy/55" aria-hidden="true" />
              <Icon className="relative z-10 size-5 text-white" aria-hidden="true" />
              <span
                className={cn(
                  "relative z-10 text-xs font-bold text-white text-balance",
                  looksUrdu(section.label) && URDU_TEXT_CLASS,
                )}
              >
                {section.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
