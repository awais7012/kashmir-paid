import { cn } from "@/lib/utils";

/** A placeholder block for the loading state. */
export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-sm", className)} />;
}

/**
 * Stands in for the homepage while its data is on the way. It is also what a
 * visitor sees when the API is slow or down: the queries keep retrying behind it
 * and the real page replaces it the moment they answer.
 */
export function HomeSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="text-foreground">
      <span className="sr-only">Loading…</span>

      {/* Top bar */}
      <div className="bg-navy-deep py-2">
        <div className="page-shell flex items-center justify-between">
          <SkeletonBar className="h-3 w-52 bg-navy-foreground/20" />
          <SkeletonBar className="h-3 w-24 bg-navy-foreground/20" />
        </div>
      </div>

      {/* Brand row */}
      <div className="border-b border-border bg-card">
        <div className="page-shell flex items-center justify-between gap-4 py-3">
          <SkeletonBar className="h-10 w-52" />
          <SkeletonBar className="h-9 w-32" />
        </div>
      </div>

      {/* Nav bar */}
      <div className="bg-navy py-2">
        <div className="page-shell flex items-center gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBar key={index} className="h-3 w-16 bg-navy-foreground/20" />
          ))}
        </div>
      </div>

      {/* Breaking strip */}
      <div className="bg-live py-2">
        <div className="page-shell">
          <SkeletonBar className="h-3 w-72 bg-live-foreground/30" />
        </div>
      </div>

      <div className="page-shell grid gap-6 py-6">
        {/* Hero row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonBar className="aspect-video w-full lg:col-span-2" />
          <div className="grid content-start gap-3 rounded-card border border-border bg-card p-4">
            <SkeletonBar className="h-4 w-28" />
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                <SkeletonBar className="aspect-video w-full" />
                <div className="grid content-center gap-2">
                  <SkeletonBar className="h-3.5 w-full" />
                  <SkeletonBar className="h-3.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category blocks */}
        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="grid gap-3">
              <SkeletonBar className="h-5 w-28" />
              <SkeletonBar className="aspect-video w-full" />
              <SkeletonBar className="h-4 w-11/12" />
              <SkeletonBar className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
