import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton, FormAlert } from "@/components/admin/controls";
import { DeleteStoryButton } from "@/components/admin/delete-story-button";
import { StoryForm } from "@/components/admin/story-form";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { ApiError, fetchStory } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/$id")({
  head: () => ({
    meta: [{ title: "Edit story · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminEditStory,
});

function AdminEditStory() {
  const { status, admin, signOut } = useAdminAuth();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "story", id],
    queryFn: () => fetchStory(id),
    enabled: status === "signed_in",
    retry: false,
  });

  if (status !== "signed_in") {
    return (
      <StudioSplash
        label={status === "checking" ? "Checking your session" : "Redirecting to sign in"}
      />
    );
  }

  const notFound = query.error instanceof ApiError && query.error.status === 404;

  return (
    <AdminShell admin={admin} onSignOut={signOut}>
      <div className="border-b-2 border-foreground pb-4">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none">
          {query.data ? "Edit story" : "Story"}
        </h1>
      </div>

      <div className="mt-8">
        {query.isPending ? (
          <div aria-busy="true">
            <p role="status" className="sr-only">
              Loading story
            </p>
            <div className="h-6 w-1/2 animate-pulse bg-muted motion-reduce:animate-none" />
            <div className="mt-4 h-32 w-full animate-pulse bg-muted motion-reduce:animate-none" />
          </div>
        ) : null}

        {notFound ? (
          <div className="grid justify-items-start gap-4 border-2 border-foreground bg-card px-5 py-10">
            <h2 className="font-display text-2xl">That story no longer exists</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              It may have been deleted in another tab or session.
            </p>
            <Link to="/admin" className={adminButton({ variant: "outline" })}>
              Back to stories
            </Link>
          </div>
        ) : null}

        {query.isError && !notFound ? (
          <div className="grid gap-4">
            <FormAlert>
              {query.error instanceof ApiError
                ? query.error.message
                : "Could not load this story. Try again."}
            </FormAlert>
            <div>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className={adminButton({ variant: "outline" })}
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {query.data ? (
          <div className="grid gap-12">
            <StoryForm
              story={query.data}
              onSaved={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin", "stories"] });
                void queryClient.invalidateQueries({ queryKey: ["admin", "story", id] });
                void navigate({ to: "/admin" });
              }}
            />

            <section className="grid gap-4 border-t-2 border-destructive pt-6">
              <h2 className="font-display text-2xl text-destructive">Delete this story</h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Removing a story takes it off the site and frees its URL. This cannot be undone.
              </p>
              <div>
                <DeleteStoryButton
                  story={query.data}
                  onDeleted={() => {
                    void queryClient.invalidateQueries({ queryKey: ["admin", "stories"] });
                    void navigate({ to: "/admin" });
                  }}
                />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
