import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton, adminInput, FormAlert } from "@/components/admin/controls";
import { DeleteStoryButton } from "@/components/admin/delete-story-button";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  ApiError,
  clearSession,
  fetchStories,
  updateStory,
  type AdminStory,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { isUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Stories · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminStoriesRoute,
});

type StatusFilter = "all" | "live" | "scheduled";

function isScheduled(story: AdminStory): boolean {
  return new Date(story.published_at).getTime() > Date.now();
}

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const minutes = Math.round(Math.abs(diff) / 60000);
  if (minutes < 1) return diff > 0 ? "in a moment" : "just now";
  const label =
    minutes < 60
      ? `${minutes} min`
      : minutes < 1440
        ? `${Math.round(minutes / 60)}h`
        : `${Math.round(minutes / 1440)}d`;
  return diff > 0 ? `in ${label}` : `${label} ago`;
}

function AdminStoriesRoute() {
  const { status, admin, signOut } = useAdminAuth();

  if (status !== "signed_in") {
    return (
      <StudioSplash
        label={status === "checking" ? "Checking your session" : "Redirecting to sign in"}
      />
    );
  }

  return (
    <AdminShell admin={admin} onSignOut={signOut}>
      <StoryList />
    </AdminShell>
  );
}

function StoryList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const query = useQuery({
    queryKey: ["admin", "stories"],
    queryFn: fetchStories,
    retry: 1,
  });

  // An expired token should land on the sign-in screen rather than an error panel.
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      clearSession();
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [query.error, navigate]);

  const publishMutation = useMutation({
    mutationFn: (story: AdminStory) =>
      updateStory(story.id, { published_at: new Date().toISOString() }),
    onSuccess: () => {
      toast.success("Story published");
      void queryClient.invalidateQueries({ queryKey: ["admin", "stories"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not publish this story.");
    },
  });

  const stories = useMemo(() => query.data?.data ?? [], [query.data]);
  const total = query.data?.meta.total ?? 0;

  const categories = useMemo(
    () => Array.from(new Set(stories.map((story) => story.category))).sort(),
    [stories],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stories.filter((story) => {
      if (category !== "all" && story.category !== category) return false;
      const scheduled = isScheduled(story);
      if (statusFilter === "live" && scheduled) return false;
      if (statusFilter === "scheduled" && !scheduled) return false;
      if (!term) return true;
      return `${story.title} ${story.slug} ${story.summary} ${story.author}`
        .toLowerCase()
        .includes(term);
    });
  }, [stories, category, statusFilter, search]);

  const filtersActive = search.trim() !== "" || category !== "all" || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setStatusFilter("all");
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
          <h1 className="mt-1 font-display text-4xl leading-none">Stories</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">{total} on the desk</p>
          <Link to="/admin/new" className={adminButton({ variant: "primary" })}>
            New story
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="grid min-w-[15rem] flex-1 gap-2">
          <label
            htmlFor="studio-search"
            className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase"
          >
            Search
          </label>
          <input
            id="studio-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Headline, slug or byline"
            className={adminInput}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="studio-category"
            className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase"
          >
            Category
          </label>
          <select
            id="studio-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={cn(adminInput, "appearance-none")}
          >
            <option value="all">All categories</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="studio-status"
            className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase"
          >
            Status
          </label>
          <select
            id="studio-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className={cn(adminInput, "appearance-none")}
          >
            <option value="all">All statuses</option>
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {filtersActive ? (
          <button
            type="button"
            onClick={clearFilters}
            className={adminButton({ variant: "outline" })}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {query.isPending ? <StoryListSkeleton /> : null}

      {query.isError && !(query.error instanceof ApiError && query.error.status === 401) ? (
        <div className="mt-6 grid gap-4">
          <FormAlert>
            {query.error instanceof ApiError
              ? query.error.message
              : "Could not load stories. Try again."}
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

      {query.isSuccess ? (
        <>
          <p role="status" className="mt-6 text-xs text-muted-foreground">
            Showing {filtered.length} of {total} stories
          </p>

          {stories.length === 0 ? (
            <div className="mt-4 grid justify-items-start gap-4 border-2 border-foreground bg-card px-5 py-10">
              <h2 className="font-display text-2xl">No stories yet</h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Stories you publish appear on the homepage right away. The first one sets the tone
                for the whole desk.
              </p>
              <Link to="/admin/new" className={adminButton({ variant: "primary" })}>
                Create the first story
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-4 grid justify-items-start gap-4 border-2 border-foreground bg-card px-5 py-10">
              <h2 className="font-display text-2xl">No stories match these filters</h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Nothing on the desk fits the current search and filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className={adminButton({ variant: "outline" })}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <div className="hidden border-b-2 border-foreground px-3 py-2 text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase lg:grid lg:grid-cols-[minmax(0,1fr)_7rem_7rem_9rem_4rem_auto] lg:gap-4">
                <span>Story</span>
                <span>Category</span>
                <span>Status</span>
                <span>Published</span>
                <span>Order</span>
                <span className="text-right">Actions</span>
              </div>

              <ul role="list">
                {filtered.map((story) => (
                  <StoryRow
                    key={story.id}
                    story={story}
                    publishingId={
                      publishMutation.isPending ? publishMutation.variables?.id : undefined
                    }
                    onPublish={(target) => publishMutation.mutate(target)}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </>
  );
}

const CELL_LABEL =
  "text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground lg:hidden";

function StoryRow({
  story,
  publishingId,
  onPublish,
}: {
  story: AdminStory;
  publishingId: string | undefined;
  onPublish: (story: AdminStory) => void;
}) {
  const scheduled = isScheduled(story);
  const queryClient = useQueryClient();

  return (
    <li className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-border py-4 lg:grid-cols-[minmax(0,1fr)_7rem_7rem_9rem_4rem_auto] lg:items-center lg:gap-4 lg:px-3">
      <div className="col-span-2 min-w-0 lg:col-span-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/$id"
            params={{ id: story.id }}
            {...storyTextAttrs(story.language)}
            className={cn(
              "font-display text-xl leading-tight font-bold hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              isUrdu(story.language) && URDU_TEXT_CLASS,
            )}
          >
            {story.title}
          </Link>
          {isUrdu(story.language) ? (
            <span className="border-2 border-foreground px-1.5 py-0.5 text-[9px] font-black tracking-[0.14em] uppercase">
              Urdu
            </span>
          ) : null}
          {story.featured ? (
            <span className="border-2 border-primary px-1.5 py-0.5 text-[9px] font-black tracking-[0.14em] text-primary uppercase">
              Featured
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">/{story.slug}</p>
      </div>

      <div className="grid gap-1">
        <span className={CELL_LABEL}>Category</span>
        <span
          {...storyTextAttrs(story.language)}
          className={cn(
            "text-xs font-bold tracking-[0.1em] uppercase",
            isUrdu(story.language) && URDU_TEXT_CLASS,
          )}
        >
          {story.category}
        </span>
      </div>

      <div className="grid gap-1">
        <span className={CELL_LABEL}>Status</span>
        <span className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase">
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 shrink-0",
              scheduled ? "border-2 border-foreground" : "bg-primary",
            )}
          />
          {scheduled ? "Scheduled" : "Live"}
        </span>
      </div>

      <div className="grid gap-1">
        <span className={CELL_LABEL}>Published</span>
        <span className="text-xs text-muted-foreground">{relativeTime(story.published_at)}</span>
      </div>

      <div className="grid gap-1">
        <span className={CELL_LABEL}>Order</span>
        <span className="text-xs text-muted-foreground">#{story.display_order}</span>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1 lg:justify-end">
        {scheduled ? (
          <button
            type="button"
            onClick={() => onPublish(story)}
            disabled={publishingId === story.id}
            className={adminButton({ variant: "outline", size: "sm" })}
          >
            {publishingId === story.id ? "Publishing" : "Publish now"}
          </button>
        ) : null}
        <Link
          to="/admin/$id"
          params={{ id: story.id }}
          className={adminButton({ variant: "outline", size: "sm" })}
        >
          Edit
        </Link>
        <DeleteStoryButton
          story={story}
          size="sm"
          onDeleted={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin", "stories"] });
          }}
        />
      </div>
    </li>
  );
}

function StoryListSkeleton() {
  return (
    <div className="mt-6" aria-busy="true">
      <p role="status" className="sr-only">
        Loading stories
      </p>
      <ul role="list" className="border-t-2 border-foreground">
        {[0, 1, 2, 3].map((index) => (
          <li key={index} className="border-b border-border py-5">
            <div className="h-5 w-2/3 animate-pulse bg-muted motion-reduce:animate-none" />
            <div className="mt-3 h-3 w-1/3 animate-pulse bg-muted motion-reduce:animate-none" />
          </li>
        ))}
      </ul>
    </div>
  );
}
