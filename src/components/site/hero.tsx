import { HeroSlider } from "@/components/site/hero-slider";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/**
 * The hero runs edge to edge, so it reads as broadcast rather than as a boxed
 * card. It is tall on a big screen and never taller than 820px, so the first
 * headline below it can still be glimpsed. `HeroSlider` owns everything inside
 * the frame: the crossfading pictures and the thumbnail rail.
 */
export function Hero({ stories, className }: { stories: Story[]; className?: string }) {
  if (stories.length === 0) return null;

  return (
    <section aria-label="Top stories" className={cn("relative w-full", className)}>
      <div className="h-[80vh] max-h-[820px] min-h-[560px] w-full">
        <HeroSlider stories={stories} />
      </div>
    </section>
  );
}
