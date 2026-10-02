import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { StoryForm } from "@/components/admin/story-form";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export const Route = createFileRoute("/admin/new")({
  head: () => ({
    meta: [{ title: "New story · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminNewStory,
});

function AdminNewStory() {
  const { status, admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (status !== "signed_in") {
    return (
      <StudioSplash
        label={status === "checking" ? "Checking your session" : "Redirecting to sign in"}
      />
    );
  }

  return (
    <AdminShell admin={admin} onSignOut={signOut}>
      <div className="border-b-2 border-foreground pb-4">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none">New story</h1>
      </div>

      <div className="mt-8">
        <StoryForm
          onSaved={(saved) => {
            void queryClient.invalidateQueries({ queryKey: ["admin", "stories"] });
            void navigate({ to: "/admin/$id", params: { id: saved.id }, replace: true });
          }}
        />
      </div>
    </AdminShell>
  );
}
