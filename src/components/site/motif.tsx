import { cn } from "@/lib/utils";

/**
 * The site's one texture: the chinar motif, tiled from a single token and held
 * at 5% so it reads as depth in a colour band, never as decoration. It is a
 * background layer, so whatever band uses it must be `relative` and its content
 * must sit above this.
 */
export function Motif({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("motif pointer-events-none absolute inset-0 opacity-[0.05]", className)}
    />
  );
}
