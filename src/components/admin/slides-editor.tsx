import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminButton, TextField } from "@/components/admin/controls";
import { measureImage } from "@/components/admin/media-field";
import { ApiError, uploadMedia } from "@/lib/admin-api";
import { mediaUrl } from "@/lib/media";
import type { HeroSlide } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

/**
 * The homepage slider, as a list. Frames are uploaded straight into it, then
 * reordered or removed. There is no headline or button to edit: each frame is
 * just a full picture or a video.
 */
export function SlidesEditor({
  slides,
  onChange,
}: {
  slides: HeroSlide[];
  onChange: (next: HeroSlide[]) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null, kind: "image" | "video") {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;

    setBusy(`0 / ${list.length}`);
    const added: HeroSlide[] = [];

    for (const [position, file] of list.entries()) {
      try {
        const dimensions = kind === "image" ? await measureImage(file) : {};
        const uploaded = await uploadMedia(file, dimensions);
        added.push({ url: uploaded.url, kind, link: "" });
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : `Could not upload ${file.name}.`);
      }
      setBusy(`${position + 1} / ${list.length}`);
    }

    setBusy(null);
    if (added.length > 0) {
      onChange([...slides, ...added]);
      toast.success(added.length === 1 ? "Slide added" : `${added.length} slides added`);
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    const next = [...slides];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  }

  function updateAt(index: number, patch: Partial<HeroSlide>) {
    onChange(
      slides.map((slide, position) => (position === index ? { ...slide, ...patch } : slide)),
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <label className={cn(adminButton({ variant: "outline", size: "sm" }), "cursor-pointer")}>
          {busy ? `Uploading ${busy}` : "Add pictures"}
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files, "image");
              event.target.value = "";
            }}
          />
        </label>
        <label className={cn(adminButton({ variant: "outline", size: "sm" }), "cursor-pointer")}>
          {busy ? `Uploading ${busy}` : "Add videos"}
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files, "video");
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {slides.length === 0 ? (
        <p className="border-2 border-dashed border-border px-4 py-8 text-center text-xs leading-relaxed text-muted-foreground">
          No slides yet. Add pictures or videos and they take turns at the top of the homepage.
          Until then, the featured story's cover is used.
        </p>
      ) : (
        <ul className="grid gap-3">
          {slides.map((slide, index) => {
            const src = mediaUrl(slide.url);
            return (
              <li
                key={`${slide.url}-${index}`}
                className="grid gap-3 border-2 border-border bg-card p-3"
              >
                <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4">
                  <div className="aspect-[16/10] overflow-hidden bg-foreground">
                    {slide.kind === "video" ? (
                      <video
                        src={src ?? undefined}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img src={src ?? ""} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black tracking-[0.14em] uppercase">
                      {index + 1}. {slide.kind}
                      {slide.link.trim() ? " · advert" : ""}
                    </span>
                    <div className="ms-auto flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Move slide ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move slide ${index + 1} down`}
                        disabled={index === slides.length - 1}
                        onClick={() => move(index, 1)}
                        className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove slide ${index + 1}`}
                        onClick={() => onChange(slides.filter((_, position) => position !== index))}
                        className={cn(adminButton({ variant: "danger", size: "sm" }), "px-2.5")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <TextField
                  meta={{
                    id: `slide-link-${index}`,
                    label: "Link (optional)",
                    hint: "Add a web address and this slide becomes an advert: clicking it opens that page in a new tab.",
                  }}
                  value={slide.link}
                  onChange={(value) => updateAt(index, { link: value })}
                  placeholder="https://example.com"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
