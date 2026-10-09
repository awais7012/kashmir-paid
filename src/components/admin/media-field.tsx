import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminButton } from "@/components/admin/controls";
import { ApiError, fetchMedia, uploadMedia, type MediaItem } from "@/lib/admin-api";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export async function measureImage(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}

/**
 * Uploads straight to the API, or picks something already in the library.
 * Drag and drop, progress, replace and remove all live here.
 */
export function MediaField({
  id,
  label,
  hint,
  value,
  onChange,
  kind,
  emptyMessage,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  value: string;
  onChange: (url: string) => void;
  kind: "image" | "video";
  emptyMessage?: string | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const library = useQuery({
    queryKey: ["admin", "media", kind],
    queryFn: () => fetchMedia({ kind }),
    enabled: libraryOpen,
  });

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setProgress(0);
    setUploadError(null);

    try {
      const dimensions = kind === "image" ? await measureImage(file) : {};
      const uploaded = await uploadMedia(file, { ...dimensions, onProgress: setProgress });
      onChange(uploaded.url);
      toast.success("Upload complete");
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : "Upload failed. Try again.";
      setUploadError(message);
      toast.error(message);
    } finally {
      setProgress(null);
    }
  }

  const resolved = mediaUrl(value);

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] font-black tracking-[0.12em] text-destructive uppercase underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "grid gap-3 border-2 bg-card p-3",
          dragging ? "border-primary" : "border-foreground",
        )}
      >
        {resolved ? (
          kind === "image" ? (
            <img
              src={resolved}
              alt=""
              className="aspect-[16/10] w-full border-2 border-border object-cover"
            />
          ) : (
            <video
              src={resolved}
              controls
              preload="metadata"
              className="aspect-video w-full bg-foreground"
            />
          )
        ) : (
          <p className="border-2 border-dashed border-border px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
            {emptyMessage ??
              `Drop ${kind === "image" ? "an image" : "a video"} here, or use the buttons below.`}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <label className={cn(adminButton({ variant: "outline", size: "sm" }), "cursor-pointer")}>
            Upload {kind}
            <input
              ref={inputRef}
              id={`${id}-file`}
              type="file"
              accept={kind === "image" ? "image/*" : "video/*"}
              className="sr-only"
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            aria-expanded={libraryOpen}
            onClick={() => setLibraryOpen((open) => !open)}
            className={adminButton({ variant: "ghost", size: "sm" })}
          >
            {libraryOpen ? "Close library" : "From library"}
          </button>
        </div>

        {progress !== null ? (
          <div>
            <div
              role="progressbar"
              aria-label="Upload progress"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 w-full bg-muted"
            >
              <div className="h-2 bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p role="status" className="mt-1 text-xs text-muted-foreground">
              Uploading {progress}%
            </p>
          </div>
        ) : null}
      </div>

      {libraryOpen ? (
        <div className="grid gap-3 border-2 border-border bg-muted/40 p-3">
          {library.isPending ? (
            <p role="status" className="text-xs text-muted-foreground">
              Loading library
            </p>
          ) : null}
          {(library.data?.data.length ?? 0) === 0 && !library.isPending ? (
            <p className="text-xs text-muted-foreground">
              Nothing uploaded yet. Use upload to add the first file.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(library.data?.data ?? []).map((item: MediaItem) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.url);
                  setLibraryOpen(false);
                }}
                title={item.original_name}
                aria-label={`Use ${item.original_name}`}
                className={cn(
                  "overflow-hidden border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  value === item.url ? "border-primary" : "border-border hover:border-foreground",
                )}
              >
                {item.kind === "image" ? (
                  <img
                    src={mediaUrl(item.thumb_url ?? item.url) ?? ""}
                    alt={item.original_name}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <span className="grid aspect-square place-items-center text-[10px] font-black uppercase">
                    Video
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {uploadError ? (
        <p role="alert" className="text-xs font-bold text-destructive">
          {uploadError}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
