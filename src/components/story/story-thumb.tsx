import { BrandedFallback } from "@/components/story/branded-fallback";
import { mediaUrl } from "@/lib/media";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/** Every thumbnail is the same 16:9 frame, filled edge to edge. */
const FRAME_SIZES = "(min-width: 1280px) 320px, (min-width: 768px) 45vw, 92vw";

/**
 * The picture, or the branded plate when there is none. A story never borrows a
 * shared stock photograph: it either has its own cover or it wears the brand.
 * The parent owns the frame (aspect and rounding); this fills it.
 */
export function StoryThumb({
  story,
  eager = false,
  className,
}: {
  story: Story;
  eager?: boolean;
  className?: string;
}) {
  const cover = mediaUrl(story.hero_image_url);
  if (!cover) return <BrandedFallback category={story.category} />;

  const thumb = mediaUrl(story.hero_thumb_url);
  return (
    <img
      loading={eager ? "eager" : "lazy"}
      width={1024}
      height={576}
      src={cover}
      srcSet={thumb ? `${thumb} 800w, ${cover} 1600w` : undefined}
      sizes={FRAME_SIZES}
      alt={story.title}
      className={cn("story-image h-full w-full object-cover group-hover:scale-[1.04]", className)}
    />
  );
}
