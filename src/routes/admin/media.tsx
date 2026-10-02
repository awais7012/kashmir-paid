import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton, FormAlert } from "@/components/admin/controls";
import { DeleteMediaButton } from "@/components/admin/delete-media-button";
import { measureImage } from "@/components/admin/media-field";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { ApiError, fetchMedia, uploadMedia, type MediaItem } from "@/lib/admin-api";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [{ title: "Media · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminMediaRoute,
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AdminMediaRoute() {
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
      <MediaLibrary />
    </AdminShell>
  );
}

function UploadButton({ kind, onUploaded }: { kind: "image" | "video"; onUploaded: () => void }) {
  const [progress, setProgress] = useState<number | null>(null);

  async function handle(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setProgress(0);
    try {
      const dimensions = kind === "image" ? await measureImage(file) : {};
      await uploadMedia(file, { ...dimensions, onProgress: setProgress });
      toast.success(`${kind === "image" ? "Image" : "Video"} uploaded`);
      onUploaded();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Upload failed. Try again.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <label className={cn(adminButton({ variant: "outline" }), "cursor-pointer")}>
      {progress === null ? `Upload ${kind}` : `Uploading ${progress}%`}
      <input
        type="file"
        accept={kind === "image" ? "image/*" : "video/*"}
        className="sr-only"
        onChange={(event) => {
          void handle(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function MediaLibrary() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const query = useQuery({
    queryKey: ["admin", "media", "library"],
    queryFn: () => fetchMedia(),
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
  }

  async function copyUrl(item: MediaItem) {
    const absolute = mediaUrl(item.url) ?? item.url;
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success("URL copied");
    } catch {
      toast.error("Copy failed. Select the URL text instead.");
    }
  }

  const items = (query.data?.data ?? []).filter((item) =>
    filter === "all" ? true : item.kind === filter,
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
          <h1 className="mt-1 font-display text-4xl leading-none">Media</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {query.data?.meta.total ?? 0} {query.data?.meta.total === 1 ? "file" : "files"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <UploadButton kind="image" onUploaded={refresh} />
        <UploadButton kind="video" onUploaded={refresh} />
        <div className="grid gap-2">
          <label
            htmlFor="media-filter"
            className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase"
          >
            Show
          </label>
          <select
            id="media-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | "image" | "video")}
            className="min-h-11 border-2 border-foreground bg-card px-3 py-2.5 text-base text-foreground md:text-sm"
          >
            <option value="all">Everything</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
      </div>

      {query.isPending ? (
        <p role="status" className="mt-8 text-xs text-muted-foreground uppercase">
          Loading media
        </p>
      ) : null}

      {query.isError ? (
        <div className="mt-8 grid gap-4">
          <FormAlert>
            {query.error instanceof ApiError ? query.error.message : "Could not load media."}
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
        items.length === 0 ? (
          <div className="mt-8 grid justify-items-start gap-3 border-2 border-foreground bg-card px-5 py-10">
            <h2 className="font-display text-2xl">No files here yet</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              Upload a cover image or a video, then pick it from any story. Images fall back to the
              bundled photographs until you upload one.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="grid gap-3 border-2 border-foreground bg-card p-3">
                {item.kind === "image" ? (
                  <img
                    src={mediaUrl(item.url) ?? ""}
                    alt={item.original_name}
                    className="aspect-[16/10] w-full border-2 border-border object-cover"
                  />
                ) : (
                  <video
                    src={mediaUrl(item.url) ?? ""}
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-foreground"
                  />
                )}

                <div className="grid gap-1">
                  <p className="truncate text-xs font-bold" title={item.original_name}>
                    {item.original_name}
                  </p>
                  <p className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                    {item.kind} · {formatBytes(item.size_bytes)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">{item.url}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyUrl(item)}
                    className={adminButton({ variant: "outline", size: "sm" })}
                  >
                    Copy URL
                  </button>
                  <DeleteMediaButton item={item} onDeleted={refresh} />
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </>
  );
}
