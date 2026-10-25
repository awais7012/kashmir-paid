import { cn } from "@/lib/utils";

/** A placeholder block for the loading state. */
export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("shimmer", className)} />;
}

/**
 * Stands in for the homepage while its data is on the way. It is also what a
 * visitor sees when the API is slow or down: the queries keep retrying behind
 * it and the real page replaces it the moment they answer.
 */
export function HomeSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="text-foreground">
      <span className="sr-only">Loading…</span>

      <div className="bg-primary py-3">
        <div className="page-shell">
          <SkeletonBar className="h-3 w-40" />
        </div>
      </div>

      <div className="bg-card shadow-card">
        <div className="page-shell flex items-center justify-between gap-4 py-4">
          <SkeletonBar className="h-9 w-44" />
          <SkeletonBar className="hidden h-5 w-72 lg:block" />
          <SkeletonBar className="h-10 w-28" />
        </div>
      </div>

      <div className="page-shell py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonBar className="aspect-video w-full lg:col-span-2" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4">
                <SkeletonBar className="aspect-video w-full" />
                <div>
                  <SkeletonBar className="h-3 w-16" />
                  <SkeletonBar className="mt-2 h-5 w-full" />
                  <SkeletonBar className="mt-1.5 h-5 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <SkeletonBar className="h-6 w-48" />
          <div className="mt-5 flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="w-72 shrink-0">
                <SkeletonBar className="aspect-video w-full" />
                <SkeletonBar className="mt-3 h-4 w-10/12" />
                <SkeletonBar className="mt-2 h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
