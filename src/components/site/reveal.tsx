import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One observer for the whole page, rather than one per element: sections and
 * cards register themselves and are dropped as soon as they have appeared, so
 * the effect runs once per element and costs nothing after that.
 */
let sharedObserver: IntersectionObserver | null = null;

function revealObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset["visible"] = "true";
          sharedObserver?.unobserve(entry.target);
        }
      },
      // A little before the element is fully on screen, so it is never seen mid-rise.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
  }
  return sharedObserver;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Wraps a section or card so it fades and rises the first time it scrolls into
 * view. The hiding is done entirely in CSS behind a `.js` root class, and this
 * component opts out for reduced motion, so content is never left invisible.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Stagger, in milliseconds, for a row of sibling cards. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      node.dataset["visible"] = "true";
      return;
    }

    const observer = revealObserver();
    if (!observer) {
      node.dataset["visible"] = "true";
      return;
    }

    // Anything already on screen — or scrolled past, as on a restored position
    // or a jump link — is shown at once, so a mid-page jump can never leave a
    // block hidden behind the reader.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) {
      node.dataset["visible"] = "true";
      return;
    }

    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
