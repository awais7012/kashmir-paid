import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("shimmer", className)} />;
}

/**
 * Stands in for a public page while its data is on the way. It is also what a
 * visitor sees when the API is slow or down: the queries keep retrying behind
 * it and the real page replaces it the moment they answer.
 */
export function PageShimmer() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-background text-foreground"
    >
      <span className="sr-only">Loading…</span>

      <div className="bg-card">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b-4 border-foreground py-5 sm:py-7">
            <div className="min-w-0">
              <Bar className="h-10 w-4/5 max-w-xl sm:h-16" />
              <Bar className="mt-3 h-3 w-56 max-w-full" />
            </div>
            <Bar className="size-10" />
          </div>
          <div className="hidden items-center justify-between border-b border-border py-3 lg:flex">
            {Array.from({ length: 8 }, (_, index) => (
              <Bar key={index} className="h-3 w-16" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <Bar className="min-h-[320px] w-full sm:min-h-[460px]" />

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index}>
              <Bar className="aspect-[16/10] w-full" />
              <Bar className="mt-4 h-3 w-24" />
              <Bar className="mt-3 h-7 w-11/12" />
              <Bar className="mt-2 h-7 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
