import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-sm", className)} />;
}

/**
 * Stands in for a public page while its data is on the way. It is also what a
 * visitor sees when the API is slow or down: the queries keep retrying behind it
 * and the real page replaces it the moment they answer.
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

      <div className="bg-navy-deep py-2">
        <div className="page-shell">
          <Bar className="h-3 w-52 bg-navy-foreground/20" />
        </div>
      </div>

      <div className="border-b border-border bg-card">
        <div className="page-shell flex items-center justify-between gap-4 py-3">
          <Bar className="h-10 w-52" />
          <Bar className="h-9 w-32" />
        </div>
      </div>

      <div className="bg-navy py-2">
        <div className="page-shell flex items-center gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <Bar key={index} className="h-3 w-16 bg-navy-foreground/20" />
          ))}
        </div>
      </div>

      <div className="page-shell py-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <Bar className="h-10 w-64 max-w-[60%]" />
          <Bar className="h-4 w-24" />
        </div>

        <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid gap-3">
              <Bar className="aspect-video w-full" />
              <Bar className="h-4 w-11/12" />
              <Bar className="h-4 w-2/3" />
              <Bar className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
