import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduced;
}

/**
 * The promo strip: the desk's own slides (settings.hero.slides), drawn as a band
 * of banners 120–160px tall. A slide with a link is an advert and opens in a new
 * tab. With no active slides the strip is not drawn at all.
 *
 * The admin slide editor and the slide contract are untouched — this only reads
 * what is already stored.
 */
export function PromoStrip({
  settings,
}: {
  settings: { hero: { slides: { url: string; kind: "image" | "video"; link: string }[] } };
}) {
  const reduced = useReducedMotion();
  const slides = settings.hero.slides.filter((slide) => slide.url.trim() !== "");
  if (slides.length === 0) return null;

  return (
    <section
      aria-label="Promotions"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      data-promo-strip
    >
      {slides.map((slide, index) => {
        const src = mediaUrl(slide.url);
        if (!src) return null;

        const media =
          slide.kind === "video" ? (
            <video
              src={src}
              muted
              loop
              playsInline
              autoPlay={!reduced}
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          );

        const frame = (
          <span className="block h-32 overflow-hidden rounded-card border border-border bg-card shadow-card sm:h-36">
            {media}
          </span>
        );

        return slide.link.trim() ? (
          <a
            key={`${slide.url}-${index}`}
            href={slide.link}
            target="_blank"
            rel="noreferrer"
            aria-label={t.readMore}
            className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {frame}
          </a>
        ) : (
          <div key={`${slide.url}-${index}`}>{frame}</div>
        );
      })}
    </section>
  );
}
