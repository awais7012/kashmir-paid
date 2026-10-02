import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BodyField } from "@/components/admin/body-field";
import {
  adminButton,
  CheckboxField,
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/controls";
import { MediaField } from "@/components/admin/media-field";
import { VideoField } from "@/components/admin/video-field";
import {
  ApiError,
  createStory,
  updateStory,
  type AdminStory,
  type FieldErrors,
  type StoryDraft,
} from "@/lib/admin-api";
import { STORY_IMAGE_KEYS, STORY_IMAGE_LABELS } from "@/lib/story-images";
import { SUGGESTED_CATEGORIES } from "@/lib/site-settings";
import { STORY_LANGUAGE_OPTIONS, type StoryLanguage } from "@/lib/story-language";
import { cn } from "@/lib/utils";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191);
}

// datetime-local needs "YYYY-MM-DDTHH:mm" in the viewer's own timezone.
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function readable(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
}

type PublishState = {
  label: string;
  message: string;
  swatch: string;
};

function publishState(value: string, isEdit: boolean): PublishState {
  if (!value) {
    return isEdit
      ? {
          label: "Keeps current date",
          message: "Leave this empty to keep the publish time the story already has.",
          swatch: "border-2 border-foreground",
        }
      : {
          label: "Publishes on save",
          message: "No date set, so this story goes live the moment you create it.",
          swatch: "border-2 border-foreground",
        };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      label: "Unreadable date",
      message: "Pick a valid date and time, or clear the field.",
      swatch: "bg-destructive",
    };
  }

  if (date.getTime() > Date.now()) {
    return {
      label: "Scheduled",
      message: `Stays a draft on the site until ${readable(date)}.`,
      swatch: "bg-foreground",
    };
  }

  return {
    label: "Live",
    message: `Visible on the site since ${readable(date)}.`,
    swatch: "bg-primary",
  };
}

export function StoryForm({
  story,
  onSaved,
}: {
  story?: AdminStory;
  onSaved: (saved: AdminStory) => void;
}) {
  const isEdit = Boolean(story);

  const [title, setTitle] = useState(story?.title ?? "");
  const [slug, setSlug] = useState(story?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [category, setCategory] = useState(story?.category ?? "");
  const [summary, setSummary] = useState(story?.summary ?? "");
  const [language, setLanguage] = useState<StoryLanguage>(story?.language ?? "en");
  const [author, setAuthor] = useState(story?.author ?? "");
  const [body, setBody] = useState(story?.body ?? "");
  const [imageKey, setImageKey] = useState(story?.image_key ?? STORY_IMAGE_KEYS[0]);
  const [heroImageUrl, setHeroImageUrl] = useState(story?.hero_image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(story?.video?.url ?? "");
  const [videoTitle, setVideoTitle] = useState(story?.video?.title ?? "");
  const [featured, setFeatured] = useState(story?.featured ?? false);
  const [displayOrder, setDisplayOrder] = useState(String(story?.display_order ?? 0));
  const [publishedAt, setPublishedAt] = useState(story ? toLocalInput(story.published_at) : "");

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const status = publishState(publishedAt, isEdit);
  const urdu = language === "ur";

  const field = (id: string, label: string, hint?: string) => ({
    id,
    label,
    hint,
    error: fieldErrors[id]?.[0],
  });

  function handleTitleChange(next: string) {
    setTitle(next);
    if (!slugTouched) setSlug(slugify(next));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const draft: StoryDraft = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      category: category.trim(),
      summary: summary.trim(),
      language,
      author: author.trim(),
      image_key: imageKey,
      featured,
      display_order: Number.parseInt(displayOrder, 10) || 0,
      body,
      hero_image_url: heroImageUrl.trim(),
      video_url: videoUrl.trim(),
      video_title: videoTitle.trim(),
    };

    if (publishedAt) {
      const parsed = new Date(publishedAt);
      if (!Number.isNaN(parsed.getTime())) draft.published_at = parsed.toISOString();
    }

    try {
      const saved = story ? await updateStory(story.id, draft) : await createStory(draft);
      toast.success(isEdit ? "Story saved" : "Story created");
      onSaved(saved);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors);
        setFormError(caught.message);
        toast.error(caught.message);
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-10">
      {formError ? (
        <FormAlert>
          {formError}
          {hasFieldErrors ? (
            <span className="mt-1 block text-xs font-normal">Fix the fields marked below.</span>
          ) : null}
        </FormAlert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="grid gap-6">
          <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Story details</h2>

          <SelectField
            meta={field(
              "language",
              "Language",
              "Urdu stories are written and shown right to left, in an Urdu typeface.",
            )}
            value={language}
            onChange={(next) => setLanguage(next as StoryLanguage)}
            options={STORY_LANGUAGE_OPTIONS}
          />

          <TextField
            meta={field("title", "Headline", urdu ? "Write the headline in Urdu." : undefined)}
            value={title}
            onChange={handleTitleChange}
            dir={urdu ? "rtl" : undefined}
            placeholder={urdu ? "وادی دنیا سے مخاطب ہے" : "The valley speaks to the world"}
            autoFocus
          />

          <TextField
            meta={field(
              "slug",
              "URL slug",
              urdu
                ? "Story addresses stay in Latin letters, so this cannot be filled in from an Urdu headline. Type the address yourself."
                : "Lowercase words separated by dashes. This becomes the story address.",
            )}
            value={slug}
            onChange={(next) => {
              setSlugTouched(true);
              setSlug(next);
            }}
            placeholder="valley-speaks-to-world"
          />

          <TextField
            meta={field("category", "Category", "Pick a section or type a new one.")}
            value={category}
            onChange={setCategory}
            list="story-category-options"
            placeholder="Kashmir"
          />
          <datalist id="story-category-options">
            {SUGGESTED_CATEGORIES.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>

          <TextAreaField
            meta={field(
              "summary",
              "Standfirst",
              "One or two sentences. Readers see this under the headline.",
            )}
            value={summary}
            onChange={setSummary}
            rows={4}
            dir={urdu ? "rtl" : undefined}
            placeholder={
              urdu
                ? "صحافیوں کی نئی نسل کشمیر کو دنیا کے سامنے پیش کر رہی ہے۔"
                : "A new generation of reporters is reshaping how Kashmir is seen."
            }
          />

          <TextField
            meta={field("author", "Byline")}
            value={author}
            onChange={setAuthor}
            placeholder="Aamir Sofi"
          />

          <BodyField value={body} onChange={setBody} error={fieldErrors["body"]?.[0]} urdu={urdu} />
        </section>

        <aside className="grid gap-8">
          <section className="grid gap-4">
            <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Cover</h2>

            <MediaField
              id="hero_image_url"
              kind="image"
              label="Uploaded cover"
              value={heroImageUrl}
              onChange={setHeroImageUrl}
              emptyMessage="No cover uploaded. The bundled photograph below is used instead."
              hint="Drag a file in, or upload one. This wins over the bundled photograph."
            />

            <SelectField
              meta={field("image_key", "Bundled photograph", "Used when no cover is uploaded.")}
              value={imageKey}
              onChange={setImageKey}
              options={STORY_IMAGE_KEYS.map((key) => ({
                value: key,
                label: STORY_IMAGE_LABELS[key],
              }))}
            />
          </section>

          <section className="grid gap-4">
            <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Placement</h2>

            <CheckboxField
              id="featured"
              label="Feature on the homepage"
              hint="Makes this the homepage hero. Only one story can hold it, so this replaces whichever story has it now."
              checked={featured}
              onChange={setFeatured}
            />

            <TextField
              meta={field(
                "display_order",
                "Display order",
                "Lower numbers appear first within a section.",
              )}
              value={displayOrder}
              onChange={setDisplayOrder}
              type="number"
              inputMode="numeric"
            />
          </section>

          <section className="grid gap-4">
            <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Publishing</h2>

            <TextField
              meta={field("published_at", "Publish date")}
              type="datetime-local"
              value={publishedAt}
              onChange={setPublishedAt}
              aside={
                <button
                  type="button"
                  onClick={() => setPublishedAt(toLocalInput(new Date().toISOString()))}
                  className="text-[10px] font-black tracking-[0.12em] text-primary uppercase underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Set to now
                </button>
              }
            />

            <div className="grid gap-2 border-2 border-border bg-muted/40 px-3 py-3">
              <p className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] uppercase">
                <span aria-hidden="true" className={cn("size-2.5 shrink-0", status.swatch)} />
                {status.label}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{status.message}</p>
            </div>
          </section>
        </aside>
      </div>

      <section className="grid gap-5 border-t-2 border-foreground pt-6">
        <h2 className="font-display text-2xl">Video</h2>
        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          Attach one video to this story. A linked YouTube or Vimeo video streams from them; an
          uploaded file is served from this server.
        </p>
        <VideoField
          videoUrl={videoUrl}
          onVideoUrlChange={setVideoUrl}
          videoTitle={videoTitle}
          onVideoTitleChange={setVideoTitle}
          error={fieldErrors["video_url"]?.[0]}
        />
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-foreground bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button type="submit" disabled={submitting} className={adminButton({ variant: "primary" })}>
          {submitting ? "Saving" : isEdit ? "Save changes" : "Create story"}
        </button>
        <Link to="/admin" className={adminButton({ variant: "outline" })}>
          Cancel
        </Link>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {submitting ? "Saving this story." : ""}
        </p>
      </div>
    </form>
  );
}
